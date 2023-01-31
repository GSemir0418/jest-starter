import React from 'react'
export const Title = (props: { title: string }) => {
  const { title } = props
  return (
    <p style={{ fontSize: '20px', color: 'red' }}>{title}</p>
  )
}