// src/app/admin/page.tsx
import AdminLayout from '@/components/AdminLayout'
import {
	Users,
	DollarSign,
	ShoppingCart,
	Activity,
	ArrowUpRight,
	ArrowDownRight,
} from 'lucide-react'

interface StatCardProps {
	title: string
	value: string
	change: string
	isPositive: boolean
	icon: React.ElementType
}

function StatCard({
	title,
	value,
	change,
	isPositive,
	icon: Icon,
}: StatCardProps) {
	return (
		<div className='bg-white rounded-lg shadow p-6'>
			<div className='flex items-center justify-between'>
				<div>
					<p className='text-sm text-gray-500 mb-1'>{title}</p>
					<h3 className='text-2xl font-bold text-gray-900'>{value}</h3>
				</div>
				<div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
					<Icon className='w-6 h-6 text-gray-600' />
				</div>
			</div>
			<div
				className={`flex items-center mt-2 text-sm ${
					isPositive ? 'text-green-600' : 'text-red-600'
				}`}
			>
				{isPositive ? (
					<ArrowUpRight className='w-4 h-4 mr-1' />
				) : (
					<ArrowDownRight className='w-4 h-4 mr-1' />
				)}
				<span>{change}</span>
			</div>
		</div>
	)
}

export default function AdminDashboard() {
	const stats = [
		{
			title: 'Total Users',
			value: '2,543',
			change: '+12.5%',
			isPositive: true,
			icon: Users,
		},
		{
			title: 'Revenue',
			value: '$45,231',
			change: '+8.2%',
			isPositive: true,
			icon: DollarSign,
		},
		{
			title: 'Orders',
			value: '1,234',
			change: '-3.1%',
			isPositive: false,
			icon: ShoppingCart,
		},
		{
			title: 'Active Sessions',
			value: '892',
			change: '+18.7%',
			isPositive: true,
			icon: Activity,
		},
	]

	const recentActivity = [
		{
			id: 1,
			user: 'John Doe',
			action: 'Placed an order',
			time: '5 minutes ago',
			amount: '$125.00',
		},
		{
			id: 2,
			user: 'Jane Smith',
			action: 'Updated profile',
			time: '12 minutes ago',
			amount: null,
		},
		{
			id: 3,
			user: 'Bob Johnson',
			action: 'Submitted support ticket',
			time: '23 minutes ago',
			amount: null,
		},
		{
			id: 4,
			user: 'Alice Brown',
			action: 'Made a payment',
			time: '1 hour ago',
			amount: '$350.00',
		},
		{
			id: 5,
			user: 'Charlie Wilson',
			action: 'Created new account',
			time: '2 hours ago',
			amount: null,
		},
	]

	return (
		<AdminLayout>
			<div className='space-y-6'>
				<div>
					<h1 className='text-2xl font-bold text-gray-900'>
						Dashboard Overview
					</h1>
					<p className='text-gray-500'>
						Welcome back! Here's what's happening today.
					</p>
				</div>

				{/* Stats Grid */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					{stats.map((stat, index) => (
						<StatCard key={index} {...stat} />
					))}
				</div>

				{/* Recent Activity */}
				<div className='bg-white rounded-lg shadow'>
					<div className='px-6 py-4 border-b border-gray-200'>
						<h2 className='text-lg font-semibold text-gray-900'>
							Recent Activity
						</h2>
					</div>
					<div className='p-6'>
						<div className='space-y-4'>
							{recentActivity.map(activity => (
								<div
									key={activity.id}
									className='flex items-center justify-between py-3 border-b last:border-0'
								>
									<div>
										<p className='font-medium text-gray-900'>{activity.user}</p>
										<p className='text-sm text-gray-500'>{activity.action}</p>
									</div>
									<div className='text-right'>
										{activity.amount && (
											<p className='font-medium text-gray-900'>
												{activity.amount}
											</p>
										)}
										<p className='text-sm text-gray-500'>{activity.time}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</AdminLayout>
	)
}
