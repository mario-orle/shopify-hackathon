import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {useState, useCallback} from 'react';

import { json } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
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
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
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
            namespace: "secret_keys",
            key: "api_key",
            type: "json",
            value: "aS1hbS1hLXNlY3JldC1hcGkta2V5Cg==",
            ownerId: "gid://shopify/AppInstallation/3"
          }
        ]
      },
    },
  );
  const responseJson = await response.json();

  return json({
    data: responseJson.data?.productCreate?.product,
  });
};

export default function Index() {
  const [position, setPosition] = useState<string[]>(['center']);
  const [company, setCompany] = useState<string>('');
  const [direction, setDirection] = useState<string[]>(['horizontal']);
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const productId = actionData?.data;

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Config updated");
    }
  }, [productId]);

  const handleSubmit = () => submit({}, { replace: true, method: "POST" });

  const handlePositionChange = useCallback((value: string[]) => setPosition(value), []);

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
                        {label: 'Left', value: 'left'},
                        {label: 'Center', value: 'center'},
                        {label: 'Right', value: 'right'},
                      ]}
                      selected={position}
                      onChange={handlePositionChange}
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
