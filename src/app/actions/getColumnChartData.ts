import moment from 'moment';
import 'moment/locale/vi';
import prisma from '../libs/prismadb';

export default async function getColumnChartData() {
	try {
		const startDate = moment().subtract(6, 'days').startOf('days');
		const endDate = moment().endOf('days');

		// Truy vấn order group by theo createDate
		const result = await prisma.order.groupBy({
			by: ['createDate'],
			where: {
				createDate: {
					gte: startDate.toISOString(),
					lte: endDate.toISOString(),
				},
				status: 'complete',
			},
			_sum: {
				amount: true,
			},
		});
		// Khởi tạo đối tượng để tổng hợp data theo ngày
		const aggregatedData: {
			[day: string]: { day: string; date: string; totalAmount: number };
		} = {};
		const currentDate = startDate.clone();
		while (currentDate <= endDate) {
			const day = currentDate.format('dddd');
			aggregatedData[day] = {
				day,
				date: currentDate.format('YYYY-MM-DD'),
				totalAmount: 0,
			};

			// Move to the next day
			currentDate.add(1, 'day');
		}
		// Calculate the total amount for each day
		result?.forEach((entry) => {
			const day = moment(entry.createDate).format('dddd');
			const amount = entry._sum.amount || 0;
			aggregatedData[day].totalAmount += amount;
		});

		// Conver the aggregatedData object to an array and sort it by date
		const formattedData = Object.values(aggregatedData).sort((a, b) => moment(a.date).diff(moment(b.date)));

		return formattedData;
	} catch (error: any) {
		throw new Error(error);
	}
}
