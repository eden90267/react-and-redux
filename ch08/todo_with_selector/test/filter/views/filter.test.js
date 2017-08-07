import React from 'react';
import {shallow} from "enzyme";

import Filters from "../../../src/filter/views/filters";
import Link from "../../../src/filter/views/link";
import {FilterTypes} from "../../../src/constants";

describe('filters', () => {
  it('should render three link', () => {
    const wrapper = shallow(<Filters/>);

    expect(wrapper.contains(<Link filter={FilterTypes.ALL}>{FilterTypes.ALL}</Link>)).toBe(true);
    expect(wrapper.contains(<Link filter={FilterTypes.COMPLETED}>{FilterTypes.COMPLETED}</Link>)).toBe(true);
    expect(wrapper.contains(<Link filter={FilterTypes.UNCOMPLETED}>{FilterTypes.UNCOMPLETED}</Link>)).toBe(true);
  });
});