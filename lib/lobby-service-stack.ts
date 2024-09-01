import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecs from "aws-cdk-lib/aws-ecs";

export class LobbyServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.apiGateway();
    this.lobbyServiceBusinessLogic();
  }

  private apiGateway() {
    const api = new apigateway.RestApi(this, "lobbyApi");

    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      "rookrallyUserPool",
      cdk.Fn.importValue("rookrallyUserPoolId"),
    );

    const auth = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "lobbyAuthorizer",
      {
        cognitoUserPools: [userPool],
      },
    );

    const candidates = api.root.addResource("candidates");
    candidates.addMethod(
      "POST",
      new apigateway.HttpIntegration("http://amazon.com"),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      },
    );
  }

  private lobbyServiceBusinessLogic() {
    const repository = new ecr.Repository(this, "lobbyServiceRepository", {
      repositoryName: "lobby-service",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // This will delete the repository when the stack is deleted
      emptyOnDelete: true,
    });

    // Create a Fargate service
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
  }
}
