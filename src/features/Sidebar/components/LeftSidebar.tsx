import * as styles from './Sidebar.css'

export function LeftSidebar() {
  return (
    <aside className={styles.sidebar}>
      <h2>왼쪽 사이드바</h2>
      <ul>
        <li>메뉴 1</li>
        <li>메뉴 2</li>
        <li>메뉴 3</li>
      </ul>
    </aside>
  )
}
