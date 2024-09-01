import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayv2integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class LobbyServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new apigatewayv2.HttpApi(this, "lobbyApi");

    const fargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        "lobbyService",
        {
          taskImageOptions: {
            image: ecs.ContainerImage.fromAsset("lobby-service-spring-boot", {
              buildArgs: {
                DOCKER_DEFAULT_PLATFORM: "linux/amd64",
              },
            }),
            containerPort: 8080,
          },
          publicLoadBalancer: true,
        },
      );

    const securityGroup = new ec2.SecurityGroup(this, "allow-in", {
      vpc: fargateService.cluster.vpc,
      allowAllOutbound: true,
    });
    securityGroup.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    securityGroup.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

    const vpcLink = new apigatewayv2.VpcLink(this, "link", {
      vpc: fargateService.cluster.vpc,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [securityGroup],
    });

    const albIntegration = new apigatewayv2integrations.HttpAlbIntegration(
      "AlbIntegration",
      fargateService.listener,
      { vpcLink },
    );

    api.addRoutes({
      path: "/{proxy+}",
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: albIntegration,
    });
  }
}

// const userPool = cognito.UserPool.fromUserPoolId(
//   this,
//   "rookrallyUserPool",
//   cdk.Fn.importValue("rookrallyUserPoolId"),
// );
