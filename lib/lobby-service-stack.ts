import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";

export class LobbyServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
}
