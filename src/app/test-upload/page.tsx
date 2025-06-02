// Save this as src/app/test-upload/page.tsx
'use client'

import { useState } from 'react'
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function TestUploadPage() {
	const [file, setFile] = useState<File | null>(null)
	const [testing, setTesting] = useState(false)
	const [result, setResult] = useState<any>(null)
	const [debugInfo, setDebugInfo] = useState<any>(null)

	const testImageKitConnection = async () => {
		try {
			const response = await fetch('/api/debug-imagekit')
			const data = await response.json()
			setDebugInfo(data)
		} catch (error) {
			setDebugInfo({ error: 'Failed to fetch debug info' })
		}
	}

	const testUpload = async () => {
		if (!file) return

		setTesting(true)
		setResult(null)

		try {
			const formData = new FormData()
			formData.append('file', file)

			const response = await fetch('/api/test-upload', {
				method: 'POST',
				body: formData,
			})

			const data = await response.json()
			setResult(data)
		} catch (error) {
			setResult({
				success: false,
				error: 'Upload request failed',
				details: error instanceof Error ? error.message : 'Unknown error',
			})
		} finally {
			setTesting(false)
		}
	}

	return (
		<div className='min-h-screen bg-gray-50 py-12'>
			<div className='max-w-4xl mx-auto px-4'>
				<div className='bg-white rounded-lg shadow p-8'>
					<h1 className='text-3xl font-bold mb-8'>ImageKit Upload Test</h1>

					{/* Debug Info Section */}
					<div className='mb-8'>
						<button
							onClick={testImageKitConnection}
							className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
						>
							Check ImageKit Configuration
						</button>

						{debugInfo && (
							<div className='mt-4 p-4 bg-gray-100 rounded'>
								<h3 className='font-semibold mb-2'>Debug Information:</h3>
								<pre className='text-sm overflow-auto text-black'>
									{JSON.stringify(debugInfo, null, 2)}
								</pre>
							</div>
						)}
					</div>

					{/* File Upload Section */}
					<div className='mb-8'>
						<h2 className='text-xl font-semibold mb-4'>Test File Upload</h2>

						<div className='border-2 border-dashed border-gray-300 rounded-lg p-6'>
							<input
								type='file'
								accept='image/*,video/*'
								onChange={e => setFile(e.target.files?.[0] || null)}
								className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
							/>

							{file && (
								<div className='mt-4 p-3 bg-blue-50 rounded'>
									<p>
										<strong>Selected:</strong> {file.name}
									</p>
									<p>
										<strong>Size:</strong>{' '}
										{(file.size / 1024 / 1024).toFixed(2)} MB
									</p>
									<p>
										<strong>Type:</strong> {file.type}
									</p>
								</div>
							)}
						</div>

						<button
							onClick={testUpload}
							disabled={!file || testing}
							className='mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
						>
							{testing ? (
								<>
									<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
									Testing Upload...
								</>
							) : (
								<>
									<Upload className='w-4 h-4 mr-2' />
									Test Upload to ImageKit
								</>
							)}
						</button>
					</div>

					{/* Results Section */}
					{result && (
						<div className='p-6 rounded-lg border'>
							<div className='flex items-center mb-4'>
								{result.success ? (
									<CheckCircle className='w-6 h-6 text-green-600 mr-2' />
								) : (
									<XCircle className='w-6 h-6 text-red-600 mr-2' />
								)}
								<h3 className='text-lg font-semibold'>
									{result.success ? 'Upload Successful!' : 'Upload Failed'}
								</h3>
							</div>

							{result.success ? (
								<div className='space-y-2'>
									<p>
										<strong>File ID:</strong> {result.uploadResponse.fileId}
									</p>
									<p>
										<strong>URL:</strong>{' '}
										<a
											href={result.uploadResponse.url}
											target='_blank'
											rel='noopener noreferrer'
											className='text-blue-600 hover:underline'
										>
											{result.uploadResponse.url}
										</a>
									</p>
									<p>
										<strong>Name:</strong> {result.uploadResponse.name}
									</p>
									<p>
										<strong>Size:</strong> {result.uploadResponse.size} bytes
									</p>
									{result.uploadResponse.width && (
										<p>
											<strong>Dimensions:</strong> {result.uploadResponse.width}{' '}
											x {result.uploadResponse.height}
										</p>
									)}

									{result.uploadResponse.url && (
										<div className='mt-4'>
											<img
												src={result.uploadResponse.url}
												alt='Uploaded file'
												className='max-w-xs max-h-48 object-contain border rounded'
											/>
										</div>
									)}
								</div>
							) : (
								<div className='space-y-2'>
									<p>
										<strong>Error:</strong> {result.error}
									</p>
									<p>
										<strong>Details:</strong> {result.details}
									</p>
									{result.file && (
										<div className='text-sm text-gray-600'>
											<p>
												File: {result.file.name} ({result.file.size} bytes,{' '}
												{result.file.type})
											</p>
										</div>
									)}
								</div>
							)}

							<details className='mt-4'>
								<summary className='cursor-pointer font-medium'>
									Raw Response
								</summary>
								<pre className='mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto'>
									{JSON.stringify(result, null, 2)}
								</pre>
							</details>
						</div>
					)}

					{/* Instructions */}
					<div className='mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
						<div className='flex items-start'>
							<AlertCircle className='w-5 h-5 text-yellow-600 mr-2 mt-0.5' />
							<div>
								<h4 className='font-semibold text-yellow-800'>
									How to use this test:
								</h4>
								<ol className='mt-2 text-sm text-yellow-700 space-y-1'>
									<li>
										1. First click "Check ImageKit Configuration" to verify your
										setup
									</li>
									<li>2. Select a test image or video file</li>
									<li>3. Click "Test Upload to ImageKit"</li>
									<li>4. Check the results to see what's working or failing</li>
								</ol>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
