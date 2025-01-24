import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

async function reproduceAwsMachineImageError() {
  try {
    const region = 'us-gov-west-1';
    
    const awsCredentials = await fromNodeProviderChain({ 
      profile: 'default',
      // Uncomment to test configuration fix
      // clientConfig: { region }
    });

    const stsClient = new STSClient({ 
      credentials: awsCredentials,
      region 
    });

    const callerIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log('Caller Identity:', callerIdentity);
  } catch (error) {
    console.error('Error reproducing AWS Machine Image datasource issue:', error);
  }
}

reproduceAwsMachineImageError();