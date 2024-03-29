// Virtual entry point for the app
import * as remixBuild from '@remix-run/dev/server-build';
import {createStorefrontClient, storefrontRedirect} from '@shopify/hydrogen';
import {
  createRequestHandler,
  getStorefrontHeaders,
  createCookieSessionStorage,
} from '@shopify/remix-oxygen';

function setContentSecurityPolicy(response, env) {
  const csp = `
  default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com https://shopify.com;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com https://shopify.com app.storyblok.com bridge.storyblok.com localhost:3000 https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://cdn.shopify.com https://fonts.googleapis.com app.storyblok.com bridge.storyblok.com localhost:3000 https://unpkg.com;
  img-src *;
  font-src 'self' data: *;
  connect-src 'self' ${env.PUBLIC_STORE_DOMAIN} https://cdn.shopify.com https://shopify.com localhost:3000;
  frame-src 'self' app.storyblok.com bridge.storyblok.com;
  frame-ancestors 'self' app.storyblok.com bridge.storyblok.com;
  `;
  response.headers.set(
    'Content-Security-Policy',
    csp.trim().replace(/\n/g, ' '),
  );
  return response;
}

/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(request, env, executionContext) {
    try {
      /**
       * Open a cache instance in the worker and a custom session instance.
       */
      if (!env?.SESSION_SECRET) {
        throw new Error('SESSION_SECRET environment variable is not set');
      }

      const waitUntil = (p) => executionContext.waitUntil(p);
      const [cache, session] = await Promise.all([
        caches.open('hydrogen'),
        HydrogenSession.init(request, [env.SESSION_SECRET]),
      ]);

      /**
       * Create Hydrogen's Storefront client.
       */
      const {storefront} = createStorefrontClient({
        cache,
        waitUntil,
        i18n: {language: 'EN', country: 'US'},
        publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
        privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
        storeDomain: env.PUBLIC_STORE_DOMAIN,
        storefrontId: env.PUBLIC_STOREFRONT_ID,
        storefrontHeaders: getStorefrontHeaders(request),
      });

      /**
       * Create a Remix request handler and pass
       * Hydrogen's Storefront client to the loader context.
       */
      const handleRequest = createRequestHandler({
        build: remixBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => ({session, storefront, env, waitUntil}),
      });

      const response = await handleRequest(request);

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({request, response, storefront});
      }

      // Apply the Content Security Policy to the response
      setContentSecurityPolicy(response, env);

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};

/**
 * This is a custom session implementation for your Hydrogen shop.
 * Feel free to customize it to your needs, add helper methods, or
 * swap out the cookie-based implementation with something else!
 */
export class HydrogenSession {
  sessionStorage;
  session;
  constructor(sessionStorage, session) {
    this.sessionStorage = sessionStorage;
    this.session = session;
  }

  static async init(request, secrets) {
    const storage = createCookieSessionStorage({
      cookie: {
        name: 'session',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secrets,
      },
    });

    const session = await storage.getSession(request.headers.get('Cookie'));

    return new this(storage, session);
  }

  has(key) {
    return this.session.has(key);
  }

  get(key) {
    return this.session.get(key);
  }

  destroy() {
    return this.sessionStorage.destroySession(this.session);
  }

  flash(key, value) {
    this.session.flash(key, value);
  }

  unset(key) {
    this.session.unset(key);
  }

  set(key, value) {
    this.session.set(key, value);
  }

  commit() {
    return this.sessionStorage.commitSession(this.session);
  }
}
