import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cf from "aws-cdk-lib/aws-cloudfront";

import { bucketName } from '../constants';

export class CdkDeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  
      const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
        bucketName,
        websiteIndexDocument: 'index.html',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        publicReadAccess: true,
        blockPublicAccess: {
          blockPublicAcls: false,
          blockPublicPolicy: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
      });

      const originAccessIdentity = new cf.OriginAccessIdentity(
        this,
        "WebAppBucketOAI",
        {
          comment: websiteBucket.bucketName,
        }
      );
      websiteBucket.grantRead(originAccessIdentity);

      const cloudfront = new cf.CloudFrontWebDistribution(
        this,
        "WebAppDistribution",
        {
          originConfigs: [
            {
              s3OriginSource: {
                s3BucketSource: websiteBucket,
              },
              behaviors: [{ isDefaultBehavior: true }],
            },
          ],
        }
      );
  
      new s3deploy.BucketDeployment(this, 'DeployWebsite', {
        sources: [s3deploy.Source.asset("../dist")],
        destinationBucket: websiteBucket,
        distribution: cloudfront,
        distributionPaths: ["/*"],
      });
  
      new cdk.CfnOutput(this, "DomainURL", {
        value: cloudfront.distributionDomainName,
      });
  }
}