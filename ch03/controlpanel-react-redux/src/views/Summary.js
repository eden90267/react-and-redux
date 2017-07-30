import React, {PropTypes} from 'react';
import {connect} from 'react-redux';


function Summary({sum}) {
  return (
    <div>Total Count: {sum}</div>
  );
}

Summary.propTypes = {
  sum: PropTypes.number.isRequired,
};

function mapStateToProps(state) {
  return {
    sum: Object.keys(state).reduce((res, key) => res += state[key], 0)
  };
}

export default connect(mapStateToProps)(Summary);