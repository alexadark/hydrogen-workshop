import {useLoaderData} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import {json} from '@shopify/remix-oxygen';
import ProductGrid from '~/components/ProductGrid';
import {getPaginationVariables} from '@shopify/hydrogen';

const seo = ({data}) => ({
  title: data?.collection?.title,
  description: data?.collection?.description,
});

export const handle = {
  seo,
};

export async function loader({params, context, request}) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });
  const {handle} = params;

  const {collection} = await context.storefront.query(COLLECTION_QUERY, {
    variables: {
      ...paginationVariables,
      handle,
    },
  });

  // Handle 404s
  if (!collection) {
    throw new Response(null, {status: 404});
  }
  return json({
    collection,
  });
}

export default function Collection() {
  const {collection} = useLoaderData();

  return (
    <>
      <div>
        <Image
          data={collection.image}
          className="h-[500px] w-full object-cover object-center"
          alt={collection.title}
        />
      </div>
      <div className="center-container">
        <header className="grid w-full gap-8 py-8 justify-items-start ">
          <h1 className="mt-10 text-6xl">{collection.title}</h1>
        </header>
        <ProductGrid
          collection={collection}
          url={`/collections/${collection.handle}`}
        />
      </div>
    </>
  );
}

const COLLECTION_QUERY = `#graphql
  query CollectionDetails($handle: String!,
    $first: Int,
    $last: Int,
    $startCursor: String,
    $endCursor: String) {
    collection(handle: $handle) {
      id
      title
      description
      image {
          altText
          width
          height
          url
        }
      handle
      products(	first: $first, last: $last,
        before: $startCursor,
        after: $endCursor,) {
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
        nodes {
          id
          title
          publishedAt
          handle
          variants(first: 1) {
            nodes {
              id
              image {
                url
                altText
                width
                height
              }
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`;