/**
 * Handles the loading of a metadata.json file from a remote URL.
 *
 * Triggers `props.onLoad` passing the initialized {PlayClips}
 * instance as only argument (async).
 *
 * @extends {preact.Component}
 */
class MetadataLoaderComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {url: props.url};
    }

    render() {
        let hdlChange = (event) => {
            this.setState({url: event.target.value});
        };

        let hdlClick = () => {
            let pc = new PlayClips(this.state.url);
            pc.initialize()
            .then( () => {
                console.log('Metadata loaded from %s!', this.state.url);
                this.props.onLoad(pc);
            });
        };

        return h(
            'div',
            {
                style: 'display: flex'
            },
            [
                h('input', {
                    style: 'flex: 3',
                    type: 'text',
                    placeholder: 'Base URL',
                    value: this.state.url,
                    onChange: hdlChange
                }),
                h('button', {
                    className: 'button-primary',
                    style: 'flex: 1',
                    onClick: hdlClick
                }, 'Load')
            ])
    }
}


/**
 * Displays a list of {Influencer} objects handling the
 * interaction with them so the user can select one.
 *
 * Triggers `props.onInfluencer` passing the selected {Influencer}
 * instance as only argument.
 *
 * @extends {preact.Component}
 */
class InfluencersComponent extends Component {

    constructor(props) {
        super(props);
        this.state.selected = props.selected;
    }

    hdlClick(influencer) {
        return () => {
            this.setState({selected: influencer.ident});
            this.props.onInfluencer(influencer);
        };
    }

    render() {
        return h(
            'div',
            {
                style: {
                    display: 'flex'
                }
            },
            this.props.influencers.map(
                (influencer) => h(
                    'button',
                    {
                        style: 'flex: 1',
                        className: influencer.ident === this.state.selected ? 'button-primary' : 'button',
                        onClick: this.hdlClick(influencer)
                    },
                    influencer.name)
            ))
    }
}


/**
 * Displays the available tags for a given influencer.
 *
 * Expects a `props.influencer` with an instance of {Influencer}.
 *
 * Triggers `props.onTag` passing the selected tag {string} as
 * only argument.
 *
 * @extends {preact.Component}
 */
class InfluencerComponent extends Component {

    render() {
        let influencer = this.props.influencer;
        if (!influencer) return null;

        // Defaults to the first tag
        if (!this.state.tag) {
            this.setState({tag: influencer.tags[0]});
        }

        return h(
            'div',
            {
                style: {}
            },
            [
                h(
                    'select',
                    {
                        onChange: (evt) => this.setState({tag: evt.target.value})
                    },
                    influencer.tags.map(
                        (tag) => h('option', {value: tag}, tag))),
                h(
                    'button',
                    {
                        className: 'button-primary',
                        onClick: (evt) => this.props.onTag(this.state.tag)
                    },
                    'Play!')
            ]
        )
    }
}


/**
 * Renders a video for a given tag.
 *
 * Expects a `props.pc` with a {PlayClips} instance and a
 * `props.video` with the video details.
 *
 * @extends {preact.Component}
 */
class VideoComponent extends Component {

    componentDidUpdate(prevProps, prevState) {
        this.ended = false;
    }

    render() {
        let {pc, video} = this.props;
        if (this.ended || !video) return null;

        // Build the video location based on the base URL for the catalog
        // and interpolates the {quality} placeholder with the configured
        // setting (high / medium / low).
        let src = pc.url + video.location.replace('{quality}', DEFAULT_QUALITY);

        return h(
            'div',
            {
                style: {
                    float: 'right',
                    background: 'white',
                    padding: '5px',
                    margin: '3px',
                    borderRadius: '5px'
                }
            },
            [
                h(
                    'video',
                    {
                        id: video.id,
                        autoplay: true,
                        playsinline: 'playsinline',
                        src: src,
                        onEnded: () => {
                            this.ended = true;
                            this.forceUpdate();
                        }
                    }),
                h('br'),
                h(
                    'span',
                    {},
                    'Video ' + video.id
                )
            ]);
    }
}

/**
 * Application container responsible for setting up the components
 * and wiring their events.
 *
 * Expects a `props.url` {string} with the base URL for the catalog.
 * Additionally `props.influencerId` can be pre-defined with the ident
 * of an influencer.
 *
 * @extends {preact.Component}
 */
class AppComponent extends Component {

    constructor(props) {
        super(props);

        if (props.url && props.influencerId) {
            let pc = new PlayClips(props.url);
            pc.initialize()
            .then( () => {
                this.setState({
                    pc: pc,
                    influencer: pc.getInfluencer(props.influencerId)
                })
            });
        }
    }

    /**
     * Obtain the video details for the selected tag
     *
     * @returns {null|object} -- video details
     */
    getVideo() {
        let {pc, influencer, tag} = this.state;
        if (!pc || !influencer || !tag) return null;

        let video = influencer.chooseVideoForTag(tag);
        console.log('Selected video:', video);
        return video;
    }

    /**
     * Shorthand for reseting the state of the component
     *
     * @param {PlayClips} pc
     * @param {Influencer} influencer
     */
    reset(pc=null, influencer=null) {
        this.setState({pc: pc, influencer: influencer, tag: null});
    }

    /**
     * Triggers the playing of the video and encapsulates the logic
     * to force the resetting of the video playback:
     *
     *   - First force an empty tag to reset the video playback
     *   - Then queue the selected tag so it triggers the playback
     *
     * @param {string} tag
     */
    playVideo(tag) {
        this.setState({tag: null}, () => {
            this.setState({tag: tag})
        });
    }

    render() {
        return h(
            'div',
            {
                style: {
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column'
                }
            },
            [
                h(
                    MetadataLoaderComponent,
                    {
                        url: this.props.url,
                        onLoad: (pc) => this.reset(pc)
                    }),
                h(
                    InfluencersComponent,
                    {
                        influencers: this.state.pc ? this.state.pc.getInfluencers() : [],
                        selected: this.props.influencerId,
                        onInfluencer: (x) => this.reset(this.state.pc, x)
                    }),
                h(
                    'div',
                    {
                        style: {
                            flex: 1,
                            background: 'url(gemorama-bg.jpg) no-repeat',
                            backgroundSize: 'cover'
                        }
                    },
                    [
                        h(
                            VideoComponent,
                            {
                                pc: this.state.pc,
                                video: this.getVideo()
                            }),
                        h(
                            InfluencerComponent,
                            {
                                influencer: this.state.influencer,
                                onTag: (x) => this.playVideo(x)
                            })
                    ])
            ])
    }
}
