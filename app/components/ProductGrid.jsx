import ProductCard from './ProductCard';
import {Pagination} from '@shopify/hydrogen';

export default function ProductGrid({collection}) {
  return (
    <section className="grid w-full gap-4 md:gap-8">
      <div className="grid grid-flow-row grid-cols-2 gap-2 gap-y-6 md:gap-4 lg:gap-6 md:grid-cols-3 lg:grid-cols-4"></div>
      <Pagination connection={collection.products}>
        {({nodes, NextLink, isLoading}) => (
          <>
            <div className="grid grid-flow-row grid-cols-2 gap-2 gap-y-6 md:gap-4 lg:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {nodes.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="flex items-center justify-center mt-6">
              <NextLink className="btn">
                {isLoading ? 'Loading...' : 'Load more products'}
              </NextLink>
            </div>
          </>
        )}
      </Pagination>
    </section>
  );
}
