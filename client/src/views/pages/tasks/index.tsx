import {
	Box,
	Button,
	Checkbox,
	HStack,
	Icon,
	IconButton,
	Table,
	TableContainer,
	Tbody,
	Td,
	Th,
	Thead,
	Tooltip,
	Tr,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { GrTasks } from 'react-icons/gr';
import { IoIosCloudDownload } from 'react-icons/io';
import { NAVIGATION } from '../../../config/const';
import useFilteredList from '../../../hooks/useFilteredList';
import { popFromNavbar, pushToNavbar } from '../../../hooks/useNavbar';
import useTask, { TASK_RESULT_TYPE, TASK_STATUS } from '../../../hooks/useTask';
import { useTheme } from '../../../hooks/useTheme';
import DeleteAlert, { DeleteAlertHandle } from '../../components/delete-alert';
import { NavbarDeleteElement, NavbarSearchElement } from '../../components/navbar';

const Tasks = () => {
	const deleteAlertRef = useRef<DeleteAlertHandle>(null);

	const { tasks, removeTask, downloadTask } = useTask();

	const theme = useTheme();

	const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

	const deleteTasks = () => {
		selectedTasks.forEach(async (id) => {
			removeTask(id);
		});
		setSelectedTasks([]);
	};

	useEffect(() => {
		pushToNavbar({
			title: 'Background Tasks',
			icon: GrTasks,
			link: NAVIGATION.TASKS,
			actions: (
				<HStack>
					<NavbarSearchElement />
					<NavbarDeleteElement
						isDisabled={selectedTasks.length === 0}
						onClick={() => deleteAlertRef.current?.open('')}
					/>
					<Button
						colorScheme='blue'
						size={'sm'}
						onClick={() => setSelectedTasks(tasks.map((task) => task.id))}
					>
						Select All
					</Button>
				</HStack>
			),
		});
		return () => {
			popFromNavbar();
		};
	}, [selectedTasks.length, tasks]);

	const filtered = useFilteredList(tasks, { type: 1, data: 1 });

	return (
		<Box p={'1rem'} textColor={theme === 'dark' ? 'white' : 'black'}>
			<TableContainer>
				<Table>
					<Thead>
						<Tr>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								Sl no.
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'20%'}>
								Type
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'50%'}>
								Description
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'10%'}>
								Status
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'10%'}>
								Started At
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								Action
							</Th>
						</Tr>
					</Thead>
					<Tbody>
						{filtered.map((task, index) => {
							return (
								<Tr key={index}>
									<Td>
										<Checkbox
											mr={'1rem'}
											isChecked={selectedTasks.includes(task.id)}
											onChange={(e) => {
												if (e.target.checked) {
													setSelectedTasks((prev) => [...prev, task.id]);
												} else {
													setSelectedTasks((prev) => prev.filter((id) => id !== task.id));
												}
											}}
											colorScheme='green'
										/>
										{index + 1}.
									</Td>
									<Td className='capitalize'>{task.type.toLowerCase().split('_').join(' ')}</Td>
									<Td className='whitespace-pre-wrap'>{task.description}</Td>
									<Td>{task.status}</Td>
									<Td>{task.createdAt}</Td>
									<Td>
										<Tooltip label='Download File' aria-label='Download File'>
											<IconButton
												hidden={task.data_result_type === TASK_RESULT_TYPE.NONE}
												isDisabled={task.status !== TASK_STATUS.COMPLETED}
												aria-label='download file'
												icon={<Icon as={IoIosCloudDownload} height={5} width={5} />}
												onClick={() => downloadTask(task.id)}
											/>
										</Tooltip>
									</Td>
								</Tr>
							);
						})}
					</Tbody>
				</Table>
			</TableContainer>
			<DeleteAlert ref={deleteAlertRef} onConfirm={deleteTasks} type={'Background Task'} />
		</Box>
	);
};

export default Tasks;
