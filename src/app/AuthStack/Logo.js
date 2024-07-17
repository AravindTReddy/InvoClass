import React from 'react'
import { css } from 'glamor'
import logo from '../../assets/images/logo.png';

class Logo extends React.Component {
  render() {
    return (
      <div {...css(styles.image_responsive)}>
        <img src={logo} alt="Logo" className="img-fluid" />
      </div>
    )
  }
}

const styles = {
  image_responsive: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30
  },
}

export default Logo
