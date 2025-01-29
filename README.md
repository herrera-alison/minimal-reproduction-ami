# #33920

## Current behavior

While running Renovate on an ARC Runner inside an EKS cluster in the GovCloud partition, we encounter an issue with STS regional endpoints. The following error is observed when attempting to retrieve AWS machine image datasources:

```
"InvalidIdentityTokenException: No OpenIDConnect provider found in your account for https://**redacted**@aws-sdk+client-sts@3.726.1/node_modules/@aws-sdk/client-sts/dist-cjs/index.js:560:21)\n    at de_CommandError (/usr/local/renovate/node_modules/.pnpm/@aws-sdk+client-sts@3.726.1/node_modules/@aws-sdk/client-sts/dist-cjs/index.js:505:19)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at /usr/local/renovate/node_modules/.pnpm/@smithy+middleware-serde@4.0.1/node_modules/@smithy/middleware-serde/dist-cjs/index.js:35:20\n    at /usr/local/renovate/node_modules/.pnpm/@smithy+core@3.1.1/node_modules/@smithy/core/dist-cjs/index.js:167:18\n    at /usr/local/renovate/node_modules/.pnpm/@smithy+middleware-retry@4.0.3/node_modules/@smithy/middleware-retry/dist-cjs/index.js:321:38\n    at /usr/local/renovate/node_modules/.pnpm/@aws-sdk+middleware-logger@3.723.0/node_modules/@aws-sdk/middleware-logger/dist-cjs/index.js:33:22\n    at /usr/local/renovate/node_modules/.pnpm/@aws-sdk+client-sts@3.726.1/node_modules/@aws-sdk/client-sts/dist-cjs/index.js:1458:78\n    at /usr/local/renovate/node_modules/.pnpm/@aws-sdk+credential-provider-web-identity@3.723.0_@aws-sdk+client-sts@3.726.1/node_modules/@aws-sdk/credential-provider-web-identity/dist-cjs/fromTokenFile.js
25\n    at /usr/local/renovate/node_modules/.pnpm/@smithy+property-provider@4.0.1/node_modules/@smithy/property-provider/dist-cjs/index.js
27\n    at coalesceProvider (/usr/local/renovate/node_modules/.pnpm/@smithy+property-provider@4.0.1/node_modules/@smithy/property-provider/dist-cjs/index.js:126:18)\n    at /usr/local/renovate/node_modules/.pnpm/@smithy+property-provider@4.0.1/node_modules/@smithy/property-provider/dist-cjs/index.js:144:18\n    at coalesceProvider (/usr/local/renovate/node_modules/.pnpm/@smithy+core@3.1.1/node_modules/@smithy/core/dist-cjs/index.js:368:18)\n    at /usr/local/renovate/node_modules/.pnpm/@smithy+core@3.1.1/node_modules/@smithy/core/dist-cjs/index.js:386:18\n    at /usr/local/renovate/node_modules/.pnpm/@smithy+core@3.1.1/node_modules/@smithy/core/dist-cjs/index.js:85:17\n    at /usr/local/renovate/node_modules/.pnpm/@aws-sdk+middleware-logger@3.723.0/node_modules/@aws-sdk/middleware-logger/dist-cjs/index.js:33:22\n    at AwsMachineImageDatasource.getSortedAwsMachineImages (/usr/local/renovate/lib/modules/datasource/aws-machine-image/index.ts:91:28)\n    at /usr/local/renovate/lib/util/cache/package/decorator.ts:134:20\n    at AwsMachineImageDatasource.getReleases (/usr/local/renovate/lib/modules/datasource/aws-machine-image/index.ts:142:20)\n    at /usr/local/renovate/lib/util/cache/package/decorator.ts:134:20"
```

### Context
- GovCloud STS regional endpoints differ from those in the standard AWS commerical cloud. 
- Reverting to version `36.0.0` of Renovate resolves the error but introduces a new issue where AMIs are not properly differentiated for `us-gov-west-1` and `us-gov-east-1`.
- Version `39.131.0` fails with the error above.
- **Difficulty in Creating a Minimal Reproduction**: Recreating the issue as a minimal reproduction is challenging due to the following reasons:
  - **Environment Specificity**: The issue occurs within an ARC Runner inside an EKS cluster in the GovCloud partition. This setup involves multiple AWS services and configurations that are not easily replicated in a simpler environment.
  - **STS Regional Endpoints**: The problem is related to STS regional endpoints, which are specific to the GovCloud partition. Testing this in a non-GovCloud environment may not reproduce the same error.
  - **Complex Dependencies**: The error involves multiple dependencies and versions of AWS SDK packages, which interact in a complex manner. Simplifying the setup may not capture the exact conditions that lead to the error.
  - **Authentication and Permissions**: The issue is tied to OpenIDConnect provider configurations and permissions, which are specific to the account and environment.

## Expected behavior

Renovate should properly differentiate AMIs for us-gov-west-1 and us-gov-east-1 without errors, even when running on ARC Runners in EKS clusters in GovCloud.

### Details on Fix
Adding the following configuration in the `fromNodeProviderChain({ profile })` call in `lib/modules/datasource/aws-machine-image/index.ts` fixes the issue:

```
clientConfig: { region }
```

## Link to the Renovate issue or Discussion

https://github.com/renovatebot/renovate/discussions/33920