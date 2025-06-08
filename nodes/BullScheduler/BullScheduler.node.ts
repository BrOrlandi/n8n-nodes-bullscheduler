import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

// Generate a random string for job names
const generateRandomString = (length: number = 8): string => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

export class BullScheduler implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'BullScheduler',
		name: 'bullScheduler',
		icon: 'file:logo.svg',
		group: ['transform'],
		version: 1,
		subtitle: 'Schedule jobs',
		description: 'Schedule jobs to execute at specific times or after delays with webhook delivery',
		defaults: {
			name: 'BullScheduler',
		},
		inputs: [
			{
				type: NodeConnectionType.Main,
			},
		],
		outputs: [
			{
				type: NodeConnectionType.Main,
			},
		],
		credentials: [
			{
				name: 'bullSchedulerApi',
				required: true,
			},
		],
		requestDefaults: {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			baseURL: '={{ $credentials.url }}',
		},
		properties: [
			// Job Name
			{
				displayName: 'Name',
				name: 'jobName',
				type: 'string',
				default: '',
				placeholder: 'my-job (auto-generated if empty)',
				description: 'Job identifier. If empty, a random string will be generated.',
			},
			// Execute At
			{
				displayName: 'Execute At',
				name: 'executeAt',
				type: 'dateTime',
				default: '',
				description: 'Schedule job to execute at a specific date and time (ISO format)',
			},
			// Data
			{
				displayName: 'Data',
				name: 'data',
				type: 'string',
				typeOptions: {
					editor: 'codeNodeEditor',
					editorLanguage: 'json',
				},
				default: '{\n  "userId": 123,\n  "action": "send-reminder"\n}',
				description: 'Job payload data as JSON that will be sent to the webhook when the job executes',
				required: true,
			},
			// Advanced Options Section
			{
				displayName: 'Advanced Options',
				name: 'advancedOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Delay in Ms',
						name: 'delayMs',
						type: 'number',
						default: 0,
						description: 'Execute job after delay in milliseconds (alternative to Execute At)',
					},
					{
						displayName: 'Webhook URL',
						name: 'webhookUrl',
						type: 'string',
						default: '',
						placeholder: 'https://your-app.com/webhook',
						description: 'Override the default webhook URL for this specific job',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('bullSchedulerApi');

		for (let i = 0; i < items.length; i++) {
			try {
				// Get parameters
				let jobName = this.getNodeParameter('jobName', i) as string;
				const executeAt = this.getNodeParameter('executeAt', i) as string;
				const dataString = this.getNodeParameter('data', i) as string;
				const advancedOptions = this.getNodeParameter('advancedOptions', i) as {
					delayMs?: number;
					webhookUrl?: string;
				};

				// Generate job name if empty
				if (!jobName || jobName.trim() === '') {
					jobName = `job-${generateRandomString()}`;
				}

				// Parse data JSON
				let data;
				try {
					data = JSON.parse(dataString);
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid JSON in Data field: ${error.message}`,
						{ itemIndex: i }
					);
				}

				// Build request body
				const requestBody: any = {
					name: jobName,
					data: data,
				};

				// Add timing - either executeAt or delayMs, but delayMs takes precedence if provided
				if (advancedOptions.delayMs && advancedOptions.delayMs > 0) {
					requestBody.delayMs = advancedOptions.delayMs;
				} else if (executeAt) {
					requestBody.executeAt = executeAt;
				} else if (!advancedOptions.delayMs || advancedOptions.delayMs <= 0) {
					throw new NodeOperationError(
						this.getNode(),
						'Either "Execute At" date or "Delay in Ms" must be provided',
						{ itemIndex: i }
					);
				}

				// Add webhook URL if provided
				if (advancedOptions.webhookUrl && advancedOptions.webhookUrl.trim() !== '') {
					requestBody.webhookUrl = advancedOptions.webhookUrl.trim();
				}

				// Make API request to BullScheduler service
				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `${credentials.url}/job`,
					headers: {
						'Authorization': `Bearer ${credentials.apiKey}`,
						'Content-Type': 'application/json',
					},
					body: requestBody,
				});

				// Process the response
				const responseData = {
					jobName: jobName,
					scheduled: true,
					response: response,
					scheduledAt: new Date().toISOString(),
					executeAt: requestBody.executeAt || null,
					delayMs: requestBody.delayMs || null,
					data: data,
					webhookUrl: requestBody.webhookUrl || null,
				};

				returnData.push({
					json: responseData,
					pairedItem: { item: i },
				});

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							jobName: this.getNodeParameter('jobName', i) || `job-${generateRandomString()}`,
							scheduled: false,
						},
						pairedItem: { item: i },
					});
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}
