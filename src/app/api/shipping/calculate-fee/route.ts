import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import GHNService from '@/app/services/ghnService';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      to_district_id, 
      to_ward_code, 
      weight, 
      service_type_id = 2, // Default: Tiêu chuẩn
      insurance_value 
    } = await request.json();

    // Validate required fields
    if (!to_district_id || !to_ward_code || !weight) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: to_district_id, to_ward_code, weight' },
        { status: 400 }
      );
    }

    // Default from address (shop location - có thể config trong env)
    const from_district_id = parseInt(process.env.GHN_FROM_DISTRICT_ID || '1442'); // Quận 1, HCM

    const feeRequest = {
      from_district_id,
      to_district_id: parseInt(to_district_id),
      to_ward_code,
      weight: parseInt(weight),
      service_type_id: parseInt(service_type_id),
      insurance_value: insurance_value ? parseInt(insurance_value) : undefined,
    };

    const result = await GHNService.calculateShippingFee(feeRequest);

    if (result.code !== 200) {
      return NextResponse.json(
        { error: result.message || 'Lỗi tính phí vận chuyển' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        total_fee: result.data.total,
        service_fee: result.data.service_fee,
        insurance_fee: result.data.insurance_fee,
        pick_station_fee: result.data.pick_station_fee,
        coupon_value: result.data.coupon_value,
        r2s_fee: result.data.r2s_fee,
        return_again: result.data.return_again,
        document_return: result.data.document_return,
        double_check: result.data.double_check,
        cod_fee: result.data.cod_fee,
        pick_remote_areas_fee: result.data.pick_remote_areas_fee,
        deliver_remote_areas_fee: result.data.deliver_remote_areas_fee,
        cod_failed_fee: result.data.cod_failed_fee,
      },
    });

  } catch (error) {
    console.error('Error calculating shipping fee:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống khi tính phí vận chuyển' },
      { status: 500 }
    );
  }
}

// GET endpoint để lấy thông tin dịch vụ vận chuyển
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const to_district = searchParams.get('to_district');

    if (!to_district) {
      return NextResponse.json(
        { error: 'Thiếu thông tin to_district' },
        { status: 400 }
      );
    }

    const from_district = parseInt(process.env.GHN_FROM_DISTRICT_ID || '1442');
    const to_district_id = parseInt(to_district);

    const services = await GHNService.getServices(from_district, to_district_id);

    if (services.code !== 200) {
      return NextResponse.json(
        { error: services.message || 'Lỗi lấy thông tin dịch vụ' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: services.data,
    });

  } catch (error) {
    console.error('Error getting shipping services:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống khi lấy thông tin dịch vụ' },
      { status: 500 }
    );
  }
}
