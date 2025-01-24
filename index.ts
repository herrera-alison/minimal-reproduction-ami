import type { Filter, Image } from '@aws-sdk/client-ec2';
import { DescribeImagesCommand, EC2Client } from '@aws-sdk/client-ec2';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

interface AwsClientConfig {
  profile?: string;
  region: string;
}

async function reproduceAwsMachineImageError() {
  try {
    const region = 'us-gov-west-1';
    
    // Simulate configuration from Renovate
    const ec2Client = new EC2Client({
      region,
      credentials: await fromNodeProviderChain({
        profile: 'default',
        // Uncomment to test the fix
        // clientConfig: { region }
      }),
    });

    // Additional STS client to potentially trigger the error
    const stsClient = new STSClient({ 
      region,
      credentials: await fromNodeProviderChain({
        profile: 'default',
        // Uncomment to test the fix
        // clientConfig: { region }
      })
    });

    // Attempt to get caller identity to simulate Renovate's behavior
    const callerIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log('Caller Identity:', callerIdentity);
  } catch (error) {
    console.error('Error reproducing AWS Machine Image datasource issue:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
  }
}

reproduceAwsMachineImageError();