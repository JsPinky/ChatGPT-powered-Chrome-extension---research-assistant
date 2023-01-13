import { LightBulbIcon, SearchIcon } from '@primer/octicons-react'
import { useState, useEffect } from 'preact/hooks'
import PropTypes from 'prop-types'
import ChatGPTQuery from './ChatGPTQuery'
import { getPossibleElementByQuerySelector, endsWithQuestionMark } from './utils.mjs'
import { defaultConfig, getUserConfig } from '../config'
import Browser from 'webextension-polyfill'

function ChatGPTCard(props) {
  const [triggered, setTriggered] = useState(false)
  const [config, setConfig] = useState(defaultConfig)
  const [render, setRender] = useState(false)

  useEffect(() => {
    getUserConfig()
      .then(setConfig)
      .then(() => setRender(true))
  }, [])

  useEffect(() => {
    const listener = (changes) => {
      const changedItems = Object.keys(changes)
      let newConfig = {}
      for (const key of changedItems) {
        newConfig[key] = changes[key].newValue
      }
      setConfig({ ...config, ...newConfig })
    }
    Browser.storage.local.onChanged.addListener(listener)
    return () => {
      Browser.storage.local.onChanged.removeListener(listener)
    }
  }, [config])

  const updatePostion = () => {
    const container = props.container
    const siteConfig = props.siteConfig
    container.classList.remove('sidebar-free')

    if (config.appendQuery) {
      const appendContainer = getPossibleElementByQuerySelector([config.appendQuery])
      if (appendContainer) {
        appendContainer.appendChild(container)
        return
      }
    }

    if (config.prependQuery) {
      const prependContainer = getPossibleElementByQuerySelector([config.prependQuery])
      if (prependContainer) {
        prependContainer.prepend(container)
        return
      }
    }

    if (config.insertAtTop) {
      const resultsContainerQuery = getPossibleElementByQuerySelector(
        siteConfig.resultsContainerQuery,
      )
      if (resultsContainerQuery) resultsContainerQuery.prepend(container)
    } else {
      const siderbarContainer = getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery)
      if (siderbarContainer) {
        siderbarContainer.prepend(container)
      } else {
        container.classList.add('sidebar-free')
        const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
        if (appendContainer) {
          appendContainer.appendChild(container)
        }
      }
    }
  }

  useEffect(() => updatePostion(), [config])

  return (
    render && (
      <div data-theme={config.themeMode}>
        {(() => {
          switch (config.triggerMode) {
            case 'always':
              return <ChatGPTQuery question={props.question} />
            case 'manually':
              if (triggered) {
                return <ChatGPTQuery question={props.question} />
              }
              return (
                <p
                  className="gpt-inner manual-btn icon-and-text"
                  onClick={() => setTriggered(true)}
                >
                  <SearchIcon size="small" /> Ask ChatGPT for this query
                </p>
              )
            case 'questionMark':
              if (endsWithQuestionMark(props.question.trim())) {
                return <ChatGPTQuery question={props.question} />
              }
              return (
                <p className="gpt-inner icon-and-text">
                  <LightBulbIcon size="small" /> Trigger ChatGPT by appending a question mark after
                  your query
                </p>
              )
          }
        })()}
      </div>
    )
  )
}

ChatGPTCard.propTypes = {
  question: PropTypes.string.isRequired,
  siteConfig: PropTypes.object.isRequired,
  container: PropTypes.object.isRequired,
}

export default ChatGPTCard
