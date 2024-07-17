import React from 'react'
import sound from "../../../../assets/images/notification-pretty-good.mp3"

class Music extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
        play: false
      }
      this.audio = new Audio(sound)
  }

  componentDidMount() {
    this.audio.addEventListener('ended', () => this.setState({ play: false }));
    this.audio.play();
  }

  componentWillUnmount() {
    this.audio.removeEventListener('ended', () => this.setState({ play: false }));
    this.audio.pause();
  }

  render() {
    return (
      <div></div>
    );
  }
}

export default Music;
