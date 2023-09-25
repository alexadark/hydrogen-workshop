import {
  Links,
  Meta,
  Outlet,
  Scripts,
  LiveReload,
  ScrollRestoration,
} from '@remix-run/react';
import appStyles from './styles/app.css';
import favicon from '../public/favicon.svg';
import {useNonce} from '@shopify/hydrogen';
import {Layout} from './components/Layout';
import {Seo} from '@shopify/hydrogen';
import {defer} from '@shopify/remix-oxygen';
import {storyblokInit, apiPlugin} from '@storyblok/react';
import Page from './components/bloks/Page';
import Banner from './components/bloks/Banner';
import PersonalizedBanners from './components/bloks/PersonalizedBanners';
import SingleProduct from './components/bloks/shopify/SingleProduct';

const components = {
  page: Page,
  banner: Banner,
  'personalized-banners': PersonalizedBanners,
  'single-product': SingleProduct,
};

storyblokInit({
  accessToken: 'aVPSgag6Rrp47qg0HOHIbgtt',
  use: [apiPlugin],
  components,
});

// This is important to avoid re-fetching root queries on sub-navigations
export const shouldRevalidate = ({formMethod, currentUrl, nextUrl}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') {
    return true;
  }

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) {
    return true;
  }

  return false;
};

export const links = () => {
  return [
    {rel: 'stylesheet', href: appStyles},
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
};

const seo = ({data}) => ({
  title: data?.shop?.name,
  description: data?.shop?.description,
});
export const handle = {
  seo,
};

export async function loader({context}) {
  const {cart} = context;
  const {shop} = await context.storefront.query(LAYOUT_QUERY);
  return defer({
    shop,
    cart: cart.get(),
  });
}

export default function App() {
  const nonce = useNonce();

  return (
    <html lang="en">
      <head>
        <Seo />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Layout>
          <Outlet />
        </Layout>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}

const LAYOUT_QUERY = `#graphql
  query layout {
    shop {
      name
      description
    }
  }
`;
