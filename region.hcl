inputs = {
  aws_region = "us-gov-west-1"
  ami_filter = {
    key = "image-id"
    # amiFilter=[{"Name":"owner-id","Values":["<owner-id>"]},{"Name":"name","Values":["<image-name-pattern>"]},{"profile":"default","region":"us-gov-west-1"},{"Name":"tag:eks_version","Values":["<eks-version>"]}]
    # currentImageName=<current-image-name>
    value = "<redacted-ami-id>"
  }
}