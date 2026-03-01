// src/app/api/imagekit-auth/route.ts
import { NextResponse } from 'next/server'
import ImageKit from '@imagekit/nodejs'

const imagekit = new ImageKit({
	privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
})

export async function GET() {
	const authParams = imagekit.helper.getAuthenticationParameters()
	return NextResponse.json(authParams)
}
