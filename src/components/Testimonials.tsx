import Image from 'next/image'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import imageTechCorp from '@/images/testimonials/tech-corp.jpg'
import imageRetailSolutions from '@/images/testimonials/retail-solutions.jpg'

const testimonials = [
  {
    content: 'Analytics Ascent transformed our data into actionable insights that drove significant business growth.',
    author: 'Tech Corp',
    image: imageTechCorp,
  },
  {
    content: 'The machine learning models provided by Analytics Ascent improved our forecasting accuracy remarkably.',
    author: 'Retail Solutions',
    image: imageRetailSolutions,
  },
]

function StarIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

export function Testimonials() {
  return (
    <div className="relative isolate bg-white py-24 sm:py-32">
      <Container>
        <FadeIn>
          <h2 className="font-display text-3xl font-medium tracking-tight text-neutral-950 sm:text-4xl">
            What Our Clients Say
          </h2>
        </FadeIn>
        <FadeInStagger className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {testimonials.map((testimonial) => (
            <FadeIn key={testimonial.author}>
              <figure className="relative rounded-3xl bg-neutral-50 p-8 ring-1 ring-neutral-950/5">
                <div className="flex gap-1 text-amber-500 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5" />
                  ))}
                </div>
                <blockquote className="text-lg text-neutral-600">
                  <p>&ldquo;{testimonial.content}&rdquo;</p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-4">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="font-display text-base font-semibold text-neutral-950">
                    {testimonial.author}
                  </div>
                </figcaption>
              </figure>
            </FadeIn>
          ))}
        </FadeInStagger>
      </Container>
    </div>
  )
}
