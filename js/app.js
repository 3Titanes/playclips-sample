function parseArgs(s) {
    return s.split('&')
        .map( x => x.split('=') )
        .reduce( (acc, x) => {
            acc[decodeURIComponent(x[0])] = decodeURIComponent(x[1]);
            return acc;
        }, {} );
}


let args = parseArgs(document.location.hash.substring(1));

let app = h(AppComponent, {
    url: args.url || DEFAULT_BASE_URL,
    influencerId: args.influencer
});


render(app, document.getElementById('app-container'));
