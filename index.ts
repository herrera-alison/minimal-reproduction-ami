import { EC2Client, DescribeImagesCommand, Image, Filter } from '@aws-sdk/client-ec2';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { readFileSync } from 'fs';
import hclToJson from 'hcl-to-json';

interface AwsClientConfig {
  profile?: string;
  region: string;
}

interface ParsedConfig {
  inputs: {
    aws_region: string;
    [key: string]: any;
  };
}

class AwsMachineImageDatasource {
  private isAmiFilter(config: Filter | AwsClientConfig): config is Filter {
    return 'Name' in config && 'Values' in config;
  }

  private getEC2Client(config: AwsClientConfig): EC2Client {
    const { profile, region } = config;
    return new EC2Client({
      region,
      credentials: fromNodeProviderChain({
        profile,
        // clientConfig: { region }, This line fixes the error
      }),
    });
  }

  private getAmiFilterCommand(filter: Filter[]): DescribeImagesCommand {
    return new DescribeImagesCommand({
      Filters: filter,
    });
  }

  loadConfig(serializedAmiFilter: string): [Filter[], AwsClientConfig] {
    const parsedConfig: ParsedConfig = JSON.parse(serializedAmiFilter);
    const filters: Filter[] = [];
    let config: AwsClientConfig = { region: parsedConfig.inputs.aws_region };
    for (const key in parsedConfig.inputs) {
      const elem = parsedConfig.inputs[key];
      if (this.isAmiFilter(elem)) {
        filters.push(elem);
      } else {
        config = { ...config, ...elem };
      }
    }
    return [filters, config];
  }

  async getSortedAwsMachineImages(serializedAmiFilter: string): Promise<Image[]> {
    const [amiFilter, clientConfig] = this.loadConfig(serializedAmiFilter);
    const amiFilterCmd = this.getAmiFilterCommand(amiFilter);
    const ec2Client = this.getEC2Client(clientConfig);
    const matchingImages = await ec2Client.send(amiFilterCmd);
    matchingImages.Images = matchingImages.Images ?? [];
    return matchingImages.Images.sort((image1, image2) => {
      const ts1 = image1.CreationDate ? Date.parse(image1.CreationDate) : 0;
      const ts2 = image2.CreationDate ? Date.parse(image2.CreationDate) : 0;
      return ts1 - ts2;
    });
  }

  async getDigest(serializedAmiFilter: string, newValue?: string): Promise<string | null> {
    const images = await this.getSortedAwsMachineImages(serializedAmiFilter);
    if (images.length < 1) {
      return null;
    }

    if (newValue) {
      const newValueMatchingImages = images.filter((image) => image.ImageId === newValue);
      if (newValueMatchingImages.length === 1) {
        return newValueMatchingImages[0].Name ?? null;
      }
      return null;
    }

    const res = await this.getReleases(serializedAmiFilter);
    return res?.releases?.[0]?.newDigest ?? null;
  }

  async getReleases(serializedAmiFilter: string): Promise<{ releases: { version: string; releaseTimestamp: string; isDeprecated: boolean; newDigest: string; }[] } | null> {
    const images = await this.getSortedAwsMachineImages(serializedAmiFilter);
    const latestImage = images[images.length - 1];
    if (!latestImage?.ImageId) {
      return null;
    }
    return {
      releases: [
        {
          version: latestImage.ImageId,
          releaseTimestamp: latestImage.CreationDate ?? '',
          isDeprecated: Date.parse(latestImage.DeprecationTime ?? Date.now().toString()) < Date.now(),
          newDigest: latestImage.Name ?? '',
        },
      ],
    };
  }
}

async function reproduceAwsMachineImageError() {
  try {
    // Read and parse the region from region.hcl
    const regionHcl = readFileSync('region.hcl', 'utf8');
    const parsedHcl = hclToJson(regionHcl);
    const region = parsedHcl.inputs.aws_region;

    // Simulate configuration from Renovate
    const ec2Client = new EC2Client({
      region,
      credentials: await fromNodeProviderChain({
        profile: 'default',
      }),
    });

    // Additional STS client to potentially trigger the error
    const stsClient = new STSClient({
      region,
      credentials: await fromNodeProviderChain({
        profile: 'default',
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