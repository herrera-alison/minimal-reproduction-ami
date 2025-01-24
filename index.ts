// import { EC2Client, DescribeImagesCommand } from "@aws-sdk/client-ec2";
// import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

// export async function getAwsMachineImages() {
//   const client = new EC2Client({
//     credentials: fromNodeProviderChain({ profile: "default" }),
//     // clientConfig: { region }, // This line is the fix and is therefore commented out for this reproduction
//   });

//   try {
//     const command = new DescribeImagesCommand({});
//     const response = await client.send(command);
//     console.log(response);
//   } catch (error) {
//     console.error("Error retrieving AWS machine images:", error);
//     throw error;
//   }
// }

// getAwsMachineImages();

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