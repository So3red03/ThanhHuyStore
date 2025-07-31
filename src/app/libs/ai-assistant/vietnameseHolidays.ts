// Vietnamese Holiday Detection Service
// Professional holiday calendar for marketing opportunities

export interface Holiday {
  name: string;
  date: Date;
  type: 'major' | 'minor' | 'commercial';
  marketingPotential: 'high' | 'medium' | 'low';
  suggestedProducts?: string[];
  campaignIdeas?: string[];
}

export class VietnameseHolidayService {
  // Get all holidays for a given year
  static getHolidays(year: number): Holiday[] {
    return [
      // Major National Holidays
      {
        name: 'Tết Nguyên Đán',
        date: this.getLunarNewYear(year),
        type: 'major',
        marketingPotential: 'high',
        suggestedProducts: ['iPhone', 'iPad', 'AirPods', 'Accessories'],
        campaignIdeas: ['Tết Sale 50%', 'Lucky Red Envelopes', 'Family Bundle Deals']
      },
      {
        name: 'Giỗ Tổ Hùng Vương',
        date: new Date(year, 3, 10), // April 10 (lunar 3/10)
        type: 'major',
        marketingPotential: 'medium',
        suggestedProducts: ['Vietnamese-themed accessories'],
        campaignIdeas: ['Patriotic Pride Sale', 'Heritage Collection']
      },
      {
        name: 'Ngày Giải Phóng Miền Nam',
        date: new Date(year, 3, 30), // April 30
        type: 'major',
        marketingPotential: 'medium',
        suggestedProducts: ['Tech gadgets', 'Travel accessories'],
        campaignIdeas: ['Freedom Sale', 'Liberation Day Deals']
      },
      {
        name: 'Ngày Quốc Tế Lao Động',
        date: new Date(year, 4, 1), // May 1
        type: 'major',
        marketingPotential: 'high',
        suggestedProducts: ['Work-from-home tech', 'Productivity tools'],
        campaignIdeas: ['Labor Day Tech Sale', 'Productivity Boost Bundle']
      },
      {
        name: 'Ngày Quốc Khánh',
        date: new Date(year, 8, 2), // September 2
        type: 'major',
        marketingPotential: 'high',
        suggestedProducts: ['Premium products', 'Flagship devices'],
        campaignIdeas: ['National Pride Sale', 'Independence Collection']
      },

      // Commercial Holidays
      {
        name: 'Valentine\'s Day',
        date: new Date(year, 1, 14), // February 14
        type: 'commercial',
        marketingPotential: 'high',
        suggestedProducts: ['AirPods', 'Apple Watch', 'Couple accessories'],
        campaignIdeas: ['Love Tech Bundle', 'Couple\'s Discount', 'His & Hers Collection']
      },
      {
        name: 'Ngày Phụ Nữ Việt Nam',
        date: new Date(year, 9, 20), // October 20
        type: 'major',
        marketingPotential: 'high',
        suggestedProducts: ['iPhone', 'Apple Watch', 'Beauty tech'],
        campaignIdeas: ['Women\'s Day Special', 'Beauty Tech Collection', 'Empowerment Sale']
      },
      {
        name: 'Black Friday',
        date: this.getBlackFriday(year),
        type: 'commercial',
        marketingPotential: 'high',
        suggestedProducts: ['All products'],
        campaignIdeas: ['Mega Sale', 'Biggest Discounts', 'Limited Time Offers']
      },
      {
        name: 'Cyber Monday',
        date: this.getCyberMonday(year),
        type: 'commercial',
        marketingPotential: 'high',
        suggestedProducts: ['Online exclusive deals'],
        campaignIdeas: ['Online Only Sale', 'Digital Deals', 'Tech Monday']
      },
      {
        name: 'Giáng Sinh',
        date: new Date(year, 11, 25), // December 25
        type: 'commercial',
        marketingPotential: 'high',
        suggestedProducts: ['Gift bundles', 'Premium accessories'],
        campaignIdeas: ['Christmas Gift Guide', 'Holiday Bundle', 'Santa\'s Tech List']
      },

      // Student/Back-to-School
      {
        name: 'Khai Giảng Năm Học',
        date: new Date(year, 8, 5), // September 5
        type: 'minor',
        marketingPotential: 'high',
        suggestedProducts: ['iPad', 'MacBook', 'Student accessories'],
        campaignIdeas: ['Back to School Sale', 'Student Discount', 'Education Bundle']
      },

      // Mid-Autumn Festival
      {
        name: 'Tết Trung Thu',
        date: this.getMidAutumnFestival(year),
        type: 'major',
        marketingPotential: 'medium',
        suggestedProducts: ['Family tech', 'Kids accessories'],
        campaignIdeas: ['Family Reunion Tech', 'Moon Festival Sale', 'Children\'s Collection']
      }
    ];
  }

  // Get next upcoming holiday
  static getNextHoliday(): { holiday: Holiday; daysUntil: number } | null {
    const now = new Date();
    const currentYear = now.getFullYear();
    const holidays = [
      ...this.getHolidays(currentYear),
      ...this.getHolidays(currentYear + 1)
    ];

    const upcomingHolidays = holidays
      .filter(holiday => holiday.date > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (upcomingHolidays.length === 0) return null;

    const nextHoliday = upcomingHolidays[0];
    const daysUntil = Math.ceil((nextHoliday.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return { holiday: nextHoliday, daysUntil };
  }

  // Get holidays within next N days
  static getUpcomingHolidays(days: number = 30): Array<{ holiday: Holiday; daysUntil: number }> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const currentYear = now.getFullYear();
    const holidays = [
      ...this.getHolidays(currentYear),
      ...this.getHolidays(currentYear + 1)
    ];

    return holidays
      .filter(holiday => holiday.date > now && holiday.date <= futureDate)
      .map(holiday => ({
        holiday,
        daysUntil: Math.ceil((holiday.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }

  // Helper methods for calculating dynamic dates
  private static getLunarNewYear(year: number): Date {
    // Simplified - in production, use proper lunar calendar calculation
    const lunarNewYearDates: { [key: number]: [number, number] } = {
      2024: [1, 10], // February 10, 2024
      2025: [0, 29], // January 29, 2025
      2026: [1, 17], // February 17, 2026
      2027: [1, 6],  // February 6, 2027
      2028: [0, 26], // January 26, 2028
    };
    
    const [month, day] = lunarNewYearDates[year] || [1, 15]; // Default fallback
    return new Date(year, month, day);
  }

  private static getBlackFriday(year: number): Date {
    // Fourth Thursday of November + 1 day
    const november = new Date(year, 10, 1); // November 1st
    const firstThursday = new Date(november);
    firstThursday.setDate(1 + (4 - november.getDay() + 7) % 7);
    const fourthThursday = new Date(firstThursday);
    fourthThursday.setDate(firstThursday.getDate() + 21);
    const blackFriday = new Date(fourthThursday);
    blackFriday.setDate(fourthThursday.getDate() + 1);
    return blackFriday;
  }

  private static getCyberMonday(year: number): Date {
    const blackFriday = this.getBlackFriday(year);
    const cyberMonday = new Date(blackFriday);
    cyberMonday.setDate(blackFriday.getDate() + 3);
    return cyberMonday;
  }

  private static getMidAutumnFestival(year: number): Date {
    // 15th day of 8th lunar month - simplified calculation
    const midAutumnDates: { [key: number]: [number, number] } = {
      2024: [8, 17], // September 17, 2024
      2025: [9, 6],  // October 6, 2025
      2026: [8, 25], // September 25, 2026
      2027: [8, 15], // September 15, 2027
      2028: [9, 3],  // October 3, 2028
    };
    
    const [month, day] = midAutumnDates[year] || [8, 15]; // Default fallback
    return new Date(year, month, day);
  }

  // Check if today is a holiday
  static getTodayHoliday(): Holiday | null {
    const today = new Date();
    const holidays = this.getHolidays(today.getFullYear());
    
    return holidays.find(holiday => 
      holiday.date.toDateString() === today.toDateString()
    ) || null;
  }

  // Get marketing opportunities for next 2 weeks
  static getMarketingOpportunities(): Array<{
    holiday: Holiday;
    daysUntil: number;
    urgency: 'high' | 'medium' | 'low';
    action: string;
  }> {
    const upcoming = this.getUpcomingHolidays(14);
    
    return upcoming
      .filter(item => item.holiday.marketingPotential !== 'low')
      .map(item => ({
        ...item,
        urgency: item.daysUntil <= 7 ? 'high' : item.daysUntil <= 10 ? 'medium' : 'low',
        action: item.daysUntil <= 7 
          ? 'Tung campaign ngay!' 
          : item.daysUntil <= 10 
          ? 'Chuẩn bị campaign' 
          : 'Lên kế hoạch marketing'
      }));
  }
}
