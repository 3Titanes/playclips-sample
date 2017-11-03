/**
 * Represents a PlayClips catalog allowing to fetch its metadata from
 * a remote URL.
 *
 * Once configured calling `.initialize` will trigger the network
 * request and return a {Promise} once the metadata has been fetched.
 */
class PlayClips {
    /**
     * @param {string} baseUrl
     */
    constructor(baseUrl) {
        if (baseUrl.charAt(baseUrl.length-1) != '/') {
            baseUrl += '/';
        }
        this.url = baseUrl;

        this.metadata = null;
    }

    /**
     * Fetches the metadata from the remote URL and initializes
     * the instance state.
     *
     * @returns {Promise}
     */
    initialize() {
        return fetch(this.url + 'metadata.json')
            .then(
                (resp) => resp.json())
            .then(
                (metadata) => {
                    this.metadata = metadata;
                });
    }

    /**
     * Obtain the list of influencers contained in the catalog.
     *
     * @returns {Array<Influencer>}
     */
    getInfluencers() {
        return Object.keys(this.metadata)
            .map( (k) => this.getInfluencer(k) );
    }

    /**
     * Get a specific influencer by its identifier.
     *
     * @param {string} ident
     * @returns {Influencer}
     */
    getInfluencer(ident) {
        return new Influencer(this, ident);
    }
}


/**
 * Represents an Influencer allowing to query a suitable video
 * from it.
 *
 */
class Influencer {
    /**
     * @param {PlayClips} playclips
     * @param {string} ident
     */
    constructor(playclips, ident) {
        this.playclips = playclips;
        this.ident = ident;
        this.data = playclips.metadata[ident];
    }

    get name () {
        return this.data.name;
    }

    get thumbnail () {
        return this.data.thumbnail;
    }

    get videos () {
        return Object.keys(this.data.videos)
            .map( (id) => Object.assign({id: id}, this.data.videos[id]) );
    }

    get tags () {
        let tags = {};
        this.videos.forEach(
            (video) => {
                video.tags.forEach( (t) => tags[t] = true );
            });
        return Object.keys(tags).sort();
    }

    /**
     * Gets a list of video details for a given tag
     *
     * @param {string} tag
     * @returns {Array<object>}
     */
    getVideosForTag(tag) {
        return this.videos
            .filter( (video) => {
                return video.tags.indexOf(tag) >= 0;
            });
    }

    /**
     * Gets a random video from the influencer matching the given tag.
     *
     * It will take into account the *weight* associated with the videos,
     * so those with a higher weight will have a higher chance of being
     * reported.
     *
     * @param {string} tag
     * @returns {null|object} -- video details
     */
    chooseVideoForTag(tag) {
        let videos = this.getVideosForTag(tag);
        if (!videos.length) {
            return null;
        }

        let sumWeigths = videos.reduce( (acc, x) => acc + x.weight, 0 );
        let randOfs = Math.floor(Math.random() * sumWeigths);

        for (let i=0, acc=0; i<videos.length; i++) {
            acc += videos[i].weight;
            if (acc > randOfs) {
                return videos[i];
            }
        }
    }

    toString() {
        return this.name;
    }
}
