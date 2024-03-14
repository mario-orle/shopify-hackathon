import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {useState, useCallback} from 'react';

import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  ChoiceList,
  Card,
  Button,
  BlockStack,
  Form,
  FormLayout,
  MediaCard,
  TextField,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

const queryId = async (request: Request) => {

  const { admin } = await authenticate.admin(request);
  const currentAppInstallationResponse = await admin.graphql(
    `#graphql
      query {
        currentAppInstallation {
          id
        }
      }`
  );

  return await currentAppInstallationResponse.json();
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const currentAppInstallationResponseJson = await queryId(request);
  const response = await admin.graphql(
    `#graphql
      query AppInstallationMetafields($ownerId: ID!) {
          appInstallation(id: $ownerId) {
            metafields(first: 10) {
              edges {
                node {
                  namespace
                  key
                  value
                }
              }
            }
          }
        }
      `,
    {
      variables: {
        ownerId: `${currentAppInstallationResponseJson.data.currentAppInstallation.id}`
      },
    },
  );
  const responseJson = await response.json();

  return json({
    data: responseJson.data.appInstallation.metafields.edges,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const position = formData.get("position");
  const direction = formData.get("direction");
  const company = formData.get("company");
  const pillPosition = formData.get("pillPosition");
  const data = {position, direction, company, pillPosition};
  const { admin } = await authenticate.admin(request);
  const currentAppInstallationResponseJson = await queryId(request);
  const response = await admin.graphql(
    `#graphql
      mutation CreateAppDataMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafieldsSetInput) {
            metafields {
              id
              namespace
              key
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
    {
      variables: {
        metafieldsSetInput: [
          {
            namespace: "beautiful_consent",
            key: "config",
            type: "json",
            value: JSON.stringify(data),
            ownerId: `${currentAppInstallationResponseJson.data.currentAppInstallation.id}`
          }
        ]
      },
    },
  );
  const responseJson = await response.json();
  return json({
    data: responseJson.data.metafieldsSet.metafields,
  });
};

export default function Index() {
  const { data } = useLoaderData<typeof loader>();
  const node = data.find((n: any) => (n.node.namespace === 'beautiful_consent' && n.node.key === 'config') )?.node
  const values = JSON.parse(node?.value ?? '{}');
  const [position, setPosition] = useState<string[]>([values.position]);
  const [pillPosition, setPillPosition] = useState<string[]>([values.pillPosition]);
  const [company, setCompany] = useState<string>(values.company);
  const [direction, setDirection] = useState<string[]>([values.direction]);
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const test = actionData?.data;

  useEffect(() => {
    if (test) {
      shopify.toast.show("Saved!");
    }
  }, [test]);

  const handleSubmit = () => submit({position, pillPosition, company, direction}, { replace: true, method: "POST" });

  const handlePositionChange = useCallback((value: string[]) => setPosition(value), []);

  const handlePillPositionChange = useCallback((value: string[]) => setPillPosition(value), []);

  const handleDirectionChange = useCallback((value: string[]) => setDirection(value), []);

  const handleCompanyChange = useCallback((value: string) => setCompany(value), []);

  return (
    <Page narrowWidth>
        <Layout>

        <Layout.Section>
            <Card>
            <MediaCard
              title="Beautiful Consent by Motive.co"
              description={`Plataforma de gestión de consentimiento (CMP) que prioriza la privacidad y ofrece una solución compatible tanto para comerciantes como para usuarios.`}
            >
              <img
                width="100%"
                alt="bc-logo"
                height="100%"
                style={{ objectFit: 'scale-down', objectPosition: 'center' }}
                src="https://visibleprivacy.com/images/bc-logo.svg"
              />
            </MediaCard>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
              <Form onSubmit={handleSubmit}>
                  <FormLayout>
                    <ChoiceList
                      title="Position"
                      choices={[
                        {label: 'Top', value: 'top'},
                        {label: 'Center', value: 'center'},
                        {label: 'Bottom', value: 'bottom'},
                      ]}
                      selected={position}
                      onChange={handlePositionChange}
                    />

                    <ChoiceList
                      title="Pill Position"
                      choices={[
                        {label: 'Left', value: 'bottom-left'},
                        {label: 'Center', value: 'bottom'},
                        {label: 'Rignt', value: 'bottom-right'},
                      ]}
                      selected={pillPosition}
                      onChange={handlePillPositionChange}
                    />

                    <ChoiceList
                      title="Direction"
                      choices={[
                        {label: 'Vertical', value: 'vertical'},
                        {label: 'Horizontal', value: 'horizontal'},
                      ]}
                      selected={direction}
                      onChange={handleDirectionChange}
                    />

                    <TextField
                      value={company}
                      onChange={handleCompanyChange}
                      label="Company"
                      autoComplete="email"
                      helpText={
                        <span>
                          Specify your company name.
                        </span>
                      }
                    />

                    <Button submit>Save</Button>
                  </FormLayout>
                </Form>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
    </Page>
  );
}
