import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schema/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';


@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(dto: CreateCategoryDto) {
    try {
      const category = new this.categoryModel(dto);
      const result = await category.save();
      
      return {
        status: 'success',
        message: 'Category created successfully',
        data: result
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpException({
          status: 'error',
          message: 'Category with this name already exists',
          data: null
        }, HttpStatus.CONFLICT);
      }
      
      throw new HttpException({
        status: 'error',
        message: 'Failed to create category',
        data: null
      }, HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    try {
      const categories = await this.categoryModel.find().sort({ createdAt: -1 });
      
      return {
        status: 'success',
        message: 'Categories fetched successfully',
        data: categories
      };
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch categories',
        data: null
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: string) {
    try {
      const category = await this.categoryModel.findById(id);
      
      if (!category) {
        throw new HttpException({
          status: 'error',
          message: 'Category not found',
          data: null
        }, HttpStatus.NOT_FOUND);
      }
      
      return {
        status: 'success',
        message: 'Category fetched successfully',
        data: category
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch category',
        data: null
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
