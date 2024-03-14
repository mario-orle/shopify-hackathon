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
  Checkbox,
  TextField,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

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
        ownerId: "gid://shopify/AppInstallation/460629049559"
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
            ownerId: "gid://shopify/AppInstallation/460629049559"
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
  const node = data.find((n: any) => (n.node.namespace === 'beautiful_consent' && n.node.key === 'config') ).node
  const values = JSON.parse(node.value);
  const [position, setPosition] = useState<string[]>([values.position]);
  const [pillPosition, setPillPosition] = useState<string[]>([values.pillPosition]);
  const [company, setCompany] = useState<string>(values.company);
  const [direction, setDirection] = useState<string[]>([values.direction]);
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  
  const test = actionData?.data;

  useEffect(() => {
    if (test) {
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

                    <Button submit>Submit</Button>
                  </FormLayout>
                </Form>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
    </Page>
  );
}
