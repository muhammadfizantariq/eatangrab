import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Menu, MenuDocument } from './schema/menu.schema';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
  ) {}

  // Helper method to save base64 image
  private async saveBase64Image(base64String: string, menuId?: string): Promise<string> {
    try {
      // Remove data:image/jpeg;base64, prefix if exists
      const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'menu-images');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const filename = `menu_${menuId || timestamp}_${randomString}.jpg`;
      const filepath = path.join(uploadsDir, filename);

      // Convert base64 to buffer and save
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filepath, buffer);

      // Return relative path for database storage
      return `uploads/menu-images/${filename}`;
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Failed to save image',
        data: null
      }, HttpStatus.BAD_REQUEST);
    }
  }

  // Helper method to delete old image
  private async deleteOldImage(imagePath: string): Promise<void> {
    try {
      if (imagePath && imagePath !== '') {
        const fullPath = path.join(process.cwd(), imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (error) {
      console.log('Error deleting old image:', error.message);
      // Don't throw error, just log it
    }
  }

  async create(dto: CreateMenuDto) {
    try {
      let imagePath = '';

      // Handle base64 image if provided - FIX: Check if imageBase64 exists
      if (dto.imageBase64 && dto.imageBase64.trim() !== '') {
        imagePath = await this.saveBase64Image(dto.imageBase64);
      }

      // Create menu item data without base64
      const menuData = {
        title: dto.title,
        desc: dto.desc,
        price: dto.price,
        combo: dto.combo || false,
        categoryId: dto.categoryId,
        isAvailable: dto.isAvailable !== undefined ? dto.isAvailable : true,
        image: imagePath
      };

      const menuItem = new this.menuModel(menuData);
      const result = await menuItem.save();

      // Update the image path with the actual menu ID - FIX: Check if imageBase64 exists
      if (imagePath && result._id && dto.imageBase64) {
        const newImagePath = await this.saveBase64Image(dto.imageBase64, result._id.toString());
        // Delete the temporary image
        await this.deleteOldImage(imagePath);
        // Update with new path
        result.image = newImagePath;
        await result.save();
      }
      
      return {
        status: 'success',
        message: 'Menu item created successfully',
        data: result
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException({
        status: 'error',
        message: 'Failed to create menu item',
        data: null
      }, HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    try {
      const menuItems = await this.menuModel
        .find()
        .populate('categoryId', 'name desc')
        .sort({ createdAt: -1 });
      
      // Convert image paths to full URLs for frontend - FIX: Proper type handling
      const menuItemsWithUrls = menuItems.map(item => {
        const itemObject = item.toObject();
        return {
          ...itemObject,
          imageUrl: itemObject.image ? `${itemObject.image}` : null
        };
      });
      
      return {
        status: 'success',
        message: 'Menu items fetched successfully',
        data: menuItemsWithUrls
      };
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch menu items',
        data: null
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  async findOne(id: string) {
    try {
      const menuItem = await this.menuModel
        .findById(id)
        .populate('categoryId', 'name desc');
      
      if (!menuItem) {
        throw new HttpException({
          status: 'error',
          message: 'Menu item not found',
          data: null
        }, HttpStatus.NOT_FOUND);
      }

      // Convert image path to full URL for frontend - FIX: Proper type handling
      const itemObject = menuItem.toObject();
      const menuItemWithUrl = {
        ...itemObject,
        imageUrl: itemObject.image ? `${itemObject.image}` : null
      };
      
      return {
        status: 'success',
        message: 'Menu item fetched successfully',
        data: menuItemWithUrl
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch menu item',
        data: null
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByCategory(categoryId: string) {
    try {
      const menuItems = await this.menuModel
        .find({ categoryId, isAvailable: true })
        .populate('categoryId', 'name desc')
        .sort({ title: 1 });
      
      // Convert image paths to full URLs for frontend - FIX: Proper type handling
      const menuItemsWithUrls = menuItems.map(item => {
        const itemObject = item.toObject();
        return {
          ...itemObject,
          imageUrl: itemObject.image ? `${itemObject.image}` : null
        };
      });
      
      return {
        status: 'success',
        message: 'Menu items by category fetched successfully',
        data: menuItemsWithUrls
      };
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch menu items by category',
        data: null
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, dto: UpdateMenuDto) {
    try {
      // Get existing menu item
      const existingMenuItem = await this.menuModel.findById(id);
      
      if (!existingMenuItem) {
        throw new HttpException({
          status: 'error',
          message: 'Menu item not found',
          data: null
        }, HttpStatus.NOT_FOUND);
      }

      let imagePath = existingMenuItem.image;

      // Handle new base64 image if provided - FIX: Check if imageBase64 exists
      if (dto.imageBase64 && dto.imageBase64.trim() !== '') {
        // Delete old image
        if (existingMenuItem.image) {
          await this.deleteOldImage(existingMenuItem.image);
        }
        
        // Save new image
        imagePath = await this.saveBase64Image(dto.imageBase64, id);
      }

      // Prepare update data without base64 - FIX: Proper type handling
      const { imageBase64, ...updateDataWithoutBase64 } = dto;
      const updateData = {
        ...updateDataWithoutBase64,
        image: imagePath
      };

      const menuItem = await this.menuModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('categoryId', 'name desc');

      if (!menuItem) {
        throw new HttpException({
          status: 'error',
          message: 'Menu item not found after update',
          data: null
        }, HttpStatus.NOT_FOUND);
      }

      // Convert image path to full URL for frontend - FIX: Proper type handling
      const itemObject = menuItem.toObject();
      const menuItemWithUrl = {
        ...itemObject,
        imageUrl: itemObject.image ? `${process.env.BASE_URL || 'http://localhost:3000'}/${itemObject.image}` : null
      };
      
      return {
        status: 'success',
        message: 'Menu item updated successfully',
        data: menuItemWithUrl
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException({
        status: 'error',
        message: 'Failed to update menu item',
        data: null
      }, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(id: string) {
    try {
      const menuItem = await this.menuModel.findById(id);
      
      if (!menuItem) {
        throw new HttpException({
          status: 'error',
          message: 'Menu item not found',
          data: null
        }, HttpStatus.NOT_FOUND);
      }

      // Delete associated image file
      if (menuItem.image) {
        await this.deleteOldImage(menuItem.image);
      }

      // Delete menu item from database
      await this.menuModel.findByIdAndDelete(id);
      
      return {
        status: 'success',
        message: 'Menu item deleted successfully',
        data: null
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException({
        status: 'error',
        message: 'Failed to delete menu item',
        data: null
      }, HttpStatus.BAD_REQUEST);
    }
  }
}