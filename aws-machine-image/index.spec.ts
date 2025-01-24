import { EC2Client } from "@aws-sdk/client-ec2";
import { mockClient } from "aws-sdk-client-mock";
import { getAwsMachineImages } from "./index";

const ec2Mock = mockClient(EC2Client);

describe("getAwsMachineImages", () => {
  beforeEach(() => {
    ec2Mock.reset();
  });

  it("should throw an error when retrieving AWS machine images", async () => {
    ec2Mock.onAnyCommand().rejects(new Error("InvalidIdentityTokenException: No OpenIDConnect provider found"));

    await expect(getAwsMachineImages()).rejects.toThrow("InvalidIdentityTokenException: No OpenIDConnect provider found");
  });
});