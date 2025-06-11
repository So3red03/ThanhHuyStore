import { ActivityType } from '@prisma/client';
import prisma from '../libs/prismadb';

export interface GetActivitiesParams {
  userId?: string;
  type?: ActivityType;
  limit?: number;
  offset?: number;
}

export default async function getActivities(params: GetActivitiesParams = {}) {
  try {
    const { userId, type, limit = 50, offset = 0 } = params;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    return activities;
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    throw new Error(error);
  }
}

export async function getUserActivities(userId: string, limit: number = 20) {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return activities;
  } catch (error: any) {
    console.error('Error fetching user activities:', error);
    throw new Error(error);
  }
}

export async function getActivityStats() {
  try {
    const stats = await prisma.activity.groupBy({
      by: ['type'],
      _count: {
        type: true
      },
      orderBy: {
        _count: {
          type: 'desc'
        }
      }
    });

    const totalActivities = await prisma.activity.count();

    return {
      stats,
      totalActivities
    };
  } catch (error: any) {
    console.error('Error fetching activity stats:', error);
    throw new Error(error);
  }
}
