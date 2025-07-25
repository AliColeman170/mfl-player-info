import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/data/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { player_id, tags } = await request.json();

    if (typeof player_id !== 'number') {
      return NextResponse.json({ error: 'Invalid player_id' }, { status: 400 });
    }

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Tags must be an array' }, { status: 400 });
    }

    const { error } = await supabase
      .from('favourites')
      .upsert({
        wallet_address: user.app_metadata.address,
        player_id,
        tags,
      })
      .select('player_id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tags updated successfully',
      player_id,
      tags 
    });

  } catch (error) {
    console.error('Tags API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}