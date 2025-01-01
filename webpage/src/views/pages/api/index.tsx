import { Divider, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import {
	API_KEY,
	API_NAME,
	API_PAGE,
	WEBHOOK_CREATE,
	WEBHOOK_INPUT,
	WEBHOOK_VALIDATE,
} from '../../../assets/Images';
import CodeBlocks from '../../components/copyblock';
import Navbar from '../../components/navbar';

export default function APIWebhook() {
	return (
		<div>
			<Navbar />
			<section className='p-6 md:px-[5%]'>
				<section id='heading' className=' pt-[70px]'>
					<h1 className='text-primary text-2xl md:text-4xl font-bold'>
						Whatsleads API Keys and Webhooks
					</h1>
				</section>
				<Tabs variant='soft-rounded' colorScheme='green'>
					<TabList>
						<Tab>API Keys</Tab>
						<Tab>Webhooks</Tab>
					</TabList>
					<TabPanels>
						<TabPanel>
							<div>
								<p className='text-lg pt-4'>
									1. After logging in go to https://app.whatsleads.com/api-keys
								</p>
							</div>
							<section
								id='terms'
								className='grid grid-cols-1 md:grid-cols-2 justify-center items-end'
							>
								<div className='flex flex-col justify-between gap-4'>
									<p className='text-lg pt-4'>2. Generate an API key for your Whatsleads API.</p>
									<img
										src={API_PAGE}
										alt='API'
										width={1200}
										height={1200}
										className='md:w-3/4 mx-auto'
									/>
								</div>
								<div className='flex flex-col justify-between gap-4'>
									<p className='text-lg pt-4'>3. Enter a name for key.</p>
									<img
										src={API_NAME}
										alt='API'
										width={1200}
										height={1200}
										className='md:w-3/4 mx-auto'
									/>
								</div>
								<div className='md:col-span-2'>
									<p className='text-lg pt-4'>4. This token will be used for authentication.</p>
									<img
										src={API_KEY}
										alt='API'
										width={1200}
										height={1200}
										className='md:w-3/4 mx-auto'
									/>
									<p className='font-bold'>
										{' '}
										*You will not be able to view this token after the dialog is closed and thus it
										must be regenerated.
									</p>
								</div>
							</section>
							<section id='text-message'>
								<div>
									<p className='text-2xl pt-4 font-medium'>Send Message</p>
								</div>
								<Divider className='w-full' />
								<div>
									<div>
										<p className='text-lg pt-4 font-medium'>Text Message</p>
									</div>
									<div className='grid grid-cols-1 md:grid-cols-2'>
										<div>
											<Divider className='w-1/2' />
											<p className='mt-4'>Sends a service text message</p>
										</div>
										<CodeBlocks
											title='Request Example'
											code={`curl --location 'https://api.whatsleads.in/v1/message/send-message' 
--header 'Authorization: Bearer YOUR_API_KEY' 
--header 'Content-Type: application/json' 
--data '{
    "recipient": "91XXXXXXXXXXX",
    "message": {
        "type": "text",
        "text": "Hello user"
    }
}'`}
											language={'bash'}
										/>
									</div>
									<div className='grid grid-cols-1 md:grid-cols-2'>
										<div>
											<p className='mt-4 text-lg'>Arguments:</p>
											<Divider className='w-3/4 my-4' />
											<p className=''>
												type: <span className='text-gray-400'>string</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<Divider className='w-3/4 my-4' />
											<p>
												text: <span className='text-gray-400'>string</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<p>Message you want to send.</p>
											<Divider className='w-3/4 my-4' />
											<p>
												recipient: <span className='text-gray-400'>string</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<p>Recipient number with country code (without &lsquo;+&lsquo;).</p>
										</div>
										<CodeBlocks
											title='Request body example'
											code={`{
    "recipient": "91XXXXXXXXXX",
    "message": {
        "type": "text",
        "text": "Hello user"
    }
}`}
											language={'javascript'}
										/>
									</div>
								</div>
							</section>
							<section id='media-message'>
								<div>
									<div>
										<p className='text-lg pt-4 font-medium'>Media Message</p>
									</div>
									<div className='grid grid-cols-1 md:grid-cols-2'>
										<div>
											<Divider className='w-3/4' />
											<p className='mt-4'>Sends a media (ex: image, video, audio).</p>
										</div>
										<div>
											<CodeBlocks
												title='Request Example'
												code={`curl --location 'https://api.whatsleads.in/v1/message/send-message' 
--header 'Authorization: Bearer YOUR_API_KEY'
--header 'Content-Type: application/json'
--data '{
    "recipient": "91XXXXXXXXXX",
    "message": {
        "type": "media",
        "link": "https://________"
		"caption": "Caption here..."
    }
}'`}
												language={'bash'}
											/>
										</div>
									</div>
									<div className='grid grid-cols-1 md:grid-cols-2'>
										<div>
											<p className='mt-4 text-lg'>Arguments</p>
											<Divider className='w-3/4 my-4' />
											<p className=''>
												type: <span className='text-gray-400'>string</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<Divider className='w-3/4 my-4' />
											<p>
												link: <span className='text-gray-400'>string</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<p>Any downloadable media link.</p>
											<Divider className='w-3/4 my-4' />
											<p>
												recipient: <span className='text-gray-400'>string</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<Divider className='w-3/4 my-4' />
											<p>
												caption: <span className='text-gray-400'>string</span>
											</p>
											<p>Custom caption for the media.</p>
											<Divider className='w-3/4 my-4' />
										</div>
										<div>
											<CodeBlocks
												title='Request body example'
												code={`{
    "recipient": "91XXXXXXXXXX",
    "message": {
        "type": "media",
        "link": "https://________",
		"caption": "Caption here..."
    }
}`}
												language={'javascript'}
											/>
										</div>
									</div>
								</div>
							</section>
							<section id='contact-message'>
								<div>
									<div>
										<p className='text-lg pt-4 font-medium'>Contact Message</p>
									</div>
									<div className='grid grid-cols-1 md:grid-cols-2'>
										<div>
											<Divider className='w-3/4' />
											<p className='mt-4'>Sends VCard.</p>
										</div>
										<div>
											<CodeBlocks
												title='Request Example'
												code={`curl --location 'https://api.whatsleads.in/v1/message/send-message' 
--header 'Authorization: Bearer YOUR_API_KEY'
--header 'Content-Type: application/json' \
--data-raw '{
    "recipient": "91XXXXXXXXXX",
    "message": {
        "type": "contact",
        "contact": {
			"first_name": "Varshmaan",
			"middle_nme": "",
			"last_name": "Sonkar",
			"title": "Mr.",
			"email_persnal": "test@test.com",
			"contact_details_phone": "91896675743",
			"contact_details_work": "",
			"contact_details_other": [],
			"links": [],
			"street":"", 
			"city": "",
			"state": "",
			"coutry": "",
			"pincode": ""
		}
    }
}'`}
												language={'bash'}
											/>
										</div>
									</div>
									<div className='grid grid-cols-1 md:grid-cols-2'>
										<div>
											<p className='mt-4 text-lg'>Arguments</p>
											<Divider className='w-3/4 my-4' />
											<p className=''>
												type: <span className='text-gray-400'>string</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<Divider className='w-3/4 my-4' />
											<p>
												first_name: <span className='text-gray-400'>string</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<p>First name of the contact.</p>
											<Divider className='w-3/4 my-4' />
											<p>
												middle_name: <span className='text-gray-400'>string</span>
											</p>
											<p>Middle name of the contact.</p>
											<Divider className='w-3/4 my-4' />
											<p>
												last_name: <span className='text-gray-400'>string</span>
											</p>
											<p>Last name of the contact.</p>
											<Divider className='w-3/4 my-4' />
											<p>
												title: <span className='text-gray-400'>string</span>
											</p>
											<p>Title of the contact.</p>
											<Divider className='w-3/4 my-4' />
											<p>
												email_personal: <span className='text-gray-400'>string</span>
											</p>
											<p>Personal email of the contact.</p>
											<Divider className='w-3/4 my-4' />
											<p>
												contact_details_phone: <span className='text-gray-400'>string</span>
											</p>
											<p>Phone number of the contact.</p>
											<Divider className='w-3/4 my-4' />
											<p>
												contact_details_work: <span className='text-gray-400'>string</span>
											</p>
											<p>Work phone number of the contact.</p>
											<Divider className='w-3/4 my-4' />
											<p>
												contact_details_other: <span className='text-gray-400'>array(string)</span>
											</p>
											<Divider className='w-3/4 my-4' />
											<p>
												links: <span className='text-gray-400'>array(string)</span>
											</p>
											<Divider className='w-3/4 my-4' />
											<p>
												street: <span className='text-gray-400'>string</span>
											</p>
											<Divider className='w-3/4 my-4' />
											<p>
												city: <span className='text-gray-400'>string</span>
											</p>
											<Divider className='w-3/4 my-4' />
											<p>
												state: <span className='text-gray-400'>string</span>
											</p>
											<Divider className='w-3/4 my-4' />
											<p>
												country: <span className='text-gray-400'>string</span>
											</p>
											<Divider className='w-3/4 my-4' />
											<p>
												pincode: <span className='text-gray-400'>string</span>
											</p>
											<Divider className='w-3/4 my-4' />
											<p>
												recipient: <span className='text-gray-400'>string</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<p>Recipient number with country code (without &lsquo;+&lsquo;).</p>
											<Divider className='w-3/4 my-4' />
										</div>
										<div>
											<CodeBlocks
												title='Request body example'
												code={`{
    "recipient": "91XXXXXXXXXX",
    "message": {
        "type": "contact",
        "contact": {
			"first_name": "Varshmaan",
			"middle_nme": "",
			"last_name": "Sonkar",
			"title": "Mr.",
			"email_persnal": "test@test.com",
			"contact_details_phone": "91896675743",
			"contact_details_work": "",
			"contact_details_other": [],
			"links": [],
			"street":"", 
			"city": "",
			"state": "",
			"coutry": "",
			"pincode": ""
		}
    }
}`}
												language={'javascript'}
											/>
										</div>
									</div>
								</div>
							</section>
							<section id='poll-message'>
								<div>
									<div>
										<p className='text-lg pt-4 font-medium'>Poll Message</p>
									</div>
									<div className='grid grid-cols-1 md:grid-cols-2'>
										<div>
											<Divider className='w-3/4' />
											<p className='mt-4'>Sends Poll.</p>
										</div>
										<div>
											<CodeBlocks
												title='Request Example'
												code={`curl --location 'https://api.whatsleads.in/v1/message/send-message' 
--header 'Authorization: Bearer YOUR_API_KEY' 
--header 'Content-Type: application/json' 
--data '{
    "recipient": "91XXXXXXXXXX",
    "message": {
        "type": "poll",
        "poll": {
			"title": "Poll",
			"options": ["Option 1", "Option 2", "Option 3"], 
			"isMultiSelect": true
		}
    }
}'`}
												language={'bash'}
											/>
										</div>
									</div>
									<div className='grid grid-cols-1 md:grid-cols-2'>
										<div>
											<p className='mt-4 text-lg'>Arguments</p>
											<Divider className='w-3/4 my-4' />
											<p className=''>
												type: <span className='text-gray-400'>string</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<Divider className='w-3/4 my-4' />
											<p>
												title: <span className='text-gray-400'>string</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<p>Title of the poll.</p>
											<Divider className='w-3/4 my-4' />
											<p>
												options: <span className='text-gray-400'>array(string)</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<p>Options for the poll.</p>
											<Divider className='w-3/4 my-4' />
											<p>
												isMultiSelect: <span className='text-gray-400'>boolean</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<p>Whether the poll is multi-select or not.</p>
											<Divider className='w-3/4 my-4' />
											<p>
												recipient: <span className='text-gray-400'>string</span>
												<span className='text-red-500'> (required)</span>
											</p>
											<p>Recipient number with country code (without &lsquo;+&lsquo;).</p>
											<Divider className='w-3/4 my-4' />
										</div>
										<div>
											<CodeBlocks
												title='Request body example'
												code={`{
    "recipient": "91XXXXXXXXXX",
    "message": {
        "type": "poll",
        "poll": {
			"title": "Poll",
			"options": ["Option 1", "Option 2", "Option 3"], //Minimum 2 options required
			"isMultiSelect": true
		}
    }
}`}
												language={'javascript'}
											/>
										</div>
									</div>
								</div>
							</section>
						</TabPanel>
						<TabPanel>
							<div>
								<p className='text-lg pt-4'>
									1. After logging in go to https://app.whatsleads.in/api-keys
								</p>
							</div>
							<section id='terms' className='grid grid-cols-1 md:grid-cols-2 justify-center'>
								<div className='flex flex-col justify-between gap-4'>
									<p className='text-lg pt-4'>2. Generate an Webhook for your WhatsApp API.</p>
									<img
										src={WEBHOOK_CREATE}
										alt='API'
										width={1200}
										height={1200}
										className='md:w-3/4 mx-auto'
									/>
								</div>
								<div className='flex flex-col justify-between gap-4'>
									<p className='text-lg pt-4'>
										3. Enter your name, select WhatsApp number and enter your webhook endpoint url
										to receive the message for your device.
									</p>
									<img
										src={WEBHOOK_INPUT}
										alt='API'
										width={1200}
										height={1200}
										className='md:w-3/4 mx-auto'
									/>
								</div>
								<div className='md:col-span-2'>
									<p className='text-lg pt-4'>4. Validate your webhook.</p>
									<img
										src={WEBHOOK_VALIDATE}
										alt='API'
										width={1200}
										height={1200}
										className='mx-auto'
									/>
								</div>
							</section>
						</TabPanel>
					</TabPanels>
				</Tabs>
			</section>
		</div>
	);
}
