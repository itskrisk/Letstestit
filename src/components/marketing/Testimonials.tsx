const reviews = [
    {
        quote: "Speed meets the city's top spots. Muncheez makes the daily crave feel like a vibe, not a chore.",
        author: "SARAH WANJIKU",
        location: "THIKA, KENYA"
    },
    {
        quote: "Real talk: managing a kitchen is easier when the delivery fleet is this sharp. They respect the craft.",
        author: "JAMES MBURU",
        location: "NAIROBI, KENYA"
    }
];

export default function Testimonials() {
    return (
        <section className="py-24 lg:py-40 bg-[#D4AF37] border-y border-black/5">
            <div className="container">
                <div className="max-w-screen-xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-24 lg:gap-40 items-start">

                        {/* Static Editorial Header */}
                        <div className="lg:w-1/3 sticky top-32">
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-800 mb-6 block">The City Voice</span>
                            <h2 className="text-4xl font-heading font-medium text-gray-900 leading-[1.1] mb-8">
                                Real Talk.
                            </h2>
                            <p className="text-gray-500 font-light leading-relaxed">
                                A few words from the people who keep the 254 moving. Built with heart, loved by Nairobi.
                            </p>
                        </div>

                        {/* Scrolling Column of Quotes */}
                        <div className="lg:w-2/3 flex flex-col gap-32">
                            {reviews.map((review, index) => (
                                <div key={index} className="group">
                                    <div className="h-px w-full bg-gray-200 mb-16 scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 origin-left" />
                                    <h3 className="text-3xl md:text-5xl font-heading font-light text-gray-900 leading-[1.2] mb-12 tracking-tight">
                                        "{review.quote}"
                                    </h3>
                                    <div className="flex items-center gap-6">
                                        <div className="w-8 h-[0.5px] bg-gray-900" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold uppercase tracking-widest text-gray-900">{review.author}</span>
                                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">{review.location}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
