import { render } from "@testing-library/react";
import { Title } from "components/Title";
import React from 'react'

describe("Title", () => {
  it('可以正确渲染标题', () => {
    const { baseElement } = render(<Title title="大字" />);
    expect(baseElement).toMatchSnapshot();
  })
})