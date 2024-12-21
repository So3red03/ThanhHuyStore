'use client';

import { useState } from 'react';
import { MdLogout, MdExpandLess, MdExpandMore } from 'react-icons/md';
import { MenuItems } from '../../../../utils/MenuItems';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminSideBarItem from './AdminSideBarItem';
import Image from 'next/image';
import { Redressed } from 'next/font/google';
import Link from 'next/link';
import { useSidebar } from '@/app/providers/SidebarProvider';

export const redressed = Redressed({ subsets: ['latin'], weight: ['400'] });

const AdminSideBar = () => {
	const [openSubItems, setOpenSubItems] = useState<any>({});
	const [openChildItems, setOpenChildItems] = useState<any>({});
	const router = useRouter();
	const { toggleSidebar, isOpen } = useSidebar();
	const handleSignOut = async () => {
		await signOut();
		router.push('/');
	};

	const toggleSubItem = (title: string) => {
		setOpenSubItems((prevState: any) => ({
			...prevState,
			[title]: !prevState[title],
		}));
	};

	const toggleChildItem = (parentTitle: string, childTitle: string) => {
		setOpenChildItems((prevState: any) => ({
			...prevState,
			[`${parentTitle}-${childTitle}`]: !prevState[`${parentTitle}-${childTitle}`],
		}));
	};

	return (
		<>
			{isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden" onClick={toggleSidebar} />}

			<div
				className={`fixed top-0 xl:top-6 left-0 h-full w-64 pt-4 xl:pt-0 opacity-100 flex flex-col bg-slate-200 z-50 transform transition-transform duration-300 ease-in-out ${
					isOpen ? 'translate-x-0 w-3/4' : '-translate-x-full'
				} xl:translate-x-0`}
			>
				<div className="flex flex-col xl:flex-row items-center justify-center gap-3 mb-5">
					{/* <Image className="rounded-full object-cover" src="/noavatar.png" alt="" width="50" height="50" /> */}
					<div className="flex flex-col">
						<Link href="/" className={`${redressed.className} font-bold text-3xl`}>
							ThanhHuy Store
						</Link>
					</div>
				</div>
				<div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#c0c0c0] scrollbar-track-transparent">
					<ul className="list-none p-5 pb-8 pt-0">
						{MenuItems.map((item) => (
							<li key={item.title} className="mt-6">
								<span className="text-gray-500 font-bold text-xs block mb-2">{item.title}</span>

								{/* Hiển thị các item chính */}
								{/* {item.list?.map((subItem) => (
									<AdminSideBarItem
										key={subItem.title}
										label={subItem.title}
										path={subItem.path}
										icon={subItem.icon}
									/>
								))} */}

								{item.dashboardItem &&
									item.dashboardItem.list &&
									item.dashboardItem.list.length > 0 && (
										<>
											{/* Nút cha hiển thị tiêu đề và icon */}
											<button
												onClick={() => toggleSubItem(item.dashboardItem.title)}
												className="w-full flex justify-between gap-2 items-center p-4 hover:bg-slate-500 hover:text-white rounded-xl"
											>
												<span className="flex items-center gap-2">
													<item.dashboardItem.icon size={20} />
													<span>{item.dashboardItem.title}</span>
												</span>
												{openSubItems[item.dashboardItem.title] ? (
													<MdExpandLess size={20} />
												) : (
													<MdExpandMore size={20} />
												)}
											</button>
											{/* Render danh sách con */}
											<ul
												className={`transition-all duration-400 ease-in-out overflow-hidden ml-4 ${
													openSubItems[item.dashboardItem.title] ? 'max-h-screen' : 'max-h-0'
												}`}
											>
												{/* Lặp qua danh sách con */}
												{item.dashboardItem.list.map((subItem) => (
													<AdminSideBarItem
														key={subItem.title}
														label={subItem.title}
														path={subItem.path}
													/>
												))}
											</ul>
										</>
									)}

								{/* Nếu có subItem, hiển thị nút để mở/đóng */}
								{item.subItem && item.subItem.list && item.subItem.list.length > 0 && (
									<>
										<button
											onClick={() => toggleSubItem(item.subItem.title)}
											className="w-full flex justify-between gap-2 items-center p-4 hover:bg-slate-500 hover:text-white rounded-xl"
										>
											<span className="flex items-center gap-2">
												<item.subItem.icon size={20} />
												<span>{item.subItem.title}</span>
											</span>
											{openSubItems[item.subItem.title] ? (
												<MdExpandLess size={20} />
											) : (
												<MdExpandMore size={20} />
											)}
										</button>
										{/* Render danh sách con  */}
										<ul
											className={`transition-all duration-400 ease-in-out overflow-hidden ml-4 ${
												openSubItems[item.subItem.title] ? 'max-h-screen' : 'max-h-0'
											}`}
										>
											{/* Duyệt danh sách con (subItem) nếu có */}
											{item.subItem.list.map((subItem) => (
												<div key={subItem.title}>
													<AdminSideBarItem
														label={subItem.title}
														path={subItem.path}
														icon={subItem.icon}
													/>

													{/* Kiểm tra nếu có danh sách con cho subItem */}
													{subItem.list && subItem.list.length > 0 && (
														<div>
															<button
																onClick={() =>
																	toggleChildItem(item.subItem.title, subItem.title)
																}
																className="w-full flex justify-between gap-2 items-center p-4 hover:bg-slate-500 hover:text-white rounded-xl"
															>
																<span className="flex items-center gap-2">
																	{subItem.icon && <subItem.icon size={20} />}
																	<span>{subItem.title}</span>
																</span>
																{openChildItems[
																	`${item.subItem.title}-${subItem.title}`
																] ? (
																	<MdExpandLess size={20} />
																) : (
																	<MdExpandMore size={20} />
																)}
															</button>
															{/* Render danh sách cháu trong ds con  */}
															<ul
																className={`transition-all duration-400 ease-in-out overflow-hidden ml-4 ${
																	openChildItems[
																		`${item.subItem.title}-${subItem.title}`
																	]
																		? 'max-h-screen'
																		: 'max-h-0'
																}`}
															>
																{subItem.list.map((child) => (
																	<AdminSideBarItem
																		key={child.title}
																		label={child.title}
																		path={child.path}
																	/>
																))}
															</ul>
														</div>
													)}
												</div>
											))}
										</ul>
									</>
								)}
							</li>
						))}
						<button
							onClick={handleSignOut}
							className="p-4 w-full flex justify-stretch hover:bg-slate-300 items-center gap-2 my-1 rounded-xl"
						>
							<MdLogout size={20} /> <span>Đăng xuất</span>
						</button>
					</ul>
				</div>
			</div>
		</>
	);
};

export default AdminSideBar;
