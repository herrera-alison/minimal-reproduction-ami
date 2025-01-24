import { EC2Client, DescribeImagesCommand } from "@aws-sdk/client-ec2";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

export async function getAwsMachineImages() {
  const client = new EC2Client({
    credentials: fromNodeProviderChain({ profile: "default" }),
    // clientConfig: { region }, // This line is the fix and is therefore commented out for this reproduction
  });

  try {
    const command = new DescribeImagesCommand({});
    const response = await client.send(command);
    console.log(response);
  } catch (error) {
    console.error("Error retrieving AWS machine images:", error);
    throw error;
  }
}

getAwsMachineImages();