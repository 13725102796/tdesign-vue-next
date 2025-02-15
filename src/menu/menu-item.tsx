import { defineComponent, computed, inject, onMounted, ref, toRefs } from 'vue';
import props from './menu-item-props';
import { TdMenuInterface, TdSubMenuInterface } from './const';
import { renderContent, renderTNodeJSX } from '../utils/render-tnode';
import { emitEvent } from '../utils/event';
import useRipple from '../hooks/useRipple';
import { usePrefixClass } from '../hooks/useConfig';

export default defineComponent({
  name: 'TMenuItem',
  props: { ...props },
  emits: ['click'],
  setup(props, ctx) {
    const { href, target = '_self' } = toRefs(props);
    const classPrefix = usePrefixClass();
    const menu = inject<TdMenuInterface>('TdMenu');
    const itemRef = ref<HTMLElement>();
    useRipple(itemRef);
    const submenu = inject<TdSubMenuInterface>('TdSubmenu', null);
    const active = computed(() => menu.activeValue.value === props.value);
    const classes = computed(() => [
      `${classPrefix.value}-menu__item`,
      {
        [`${classPrefix.value}-is-active`]: active.value,
        [`${classPrefix.value}-is-disabled`]: props.disabled,
        [`${classPrefix.value}-menu__item--plain`]: !ctx.slots.icon && !props.icon,
        [`${classPrefix.value}-submenu__item`]: !!submenu && !menu.isHead,
      },
    ]);

    // lifetimes
    onMounted(() => {
      menu?.vMenu?.add({ value: props.value, parent: submenu?.value, vnode: ctx.slots.default });
    });

    return {
      classPrefix,
      menu,
      active,
      classes,
      itemRef,
      href,
      target,
    };
  },
  methods: {
    handleClick(e: MouseEvent) {
      e.stopPropagation();
      if (this.disabled) return;
      this.menu.select(this.value);
      emitEvent(this, 'click');
      if (this.to) {
        const router = this.router || this.$router;
        const methods: string = this.replace ? 'replace' : 'push';
        router[methods](this.to).catch((err: Error) => {
          // vue-router 3.1.0+ push/replace cause NavigationDuplicated error
          // https://github.com/vuejs/vue-router/issues/2872
          // 当前path和目标path相同时，会抛出NavigationDuplicated的错误
          if (
            err.name !== 'NavigationDuplicated' &&
            !err.message.includes('Avoided redundant navigation to current location')
          ) {
            throw err;
          }
        });
      }
    },
  },
  render() {
    return (
      <li ref="itemRef" class={this.classes} onClick={this.handleClick}>
        {renderTNodeJSX(this, 'icon')}
        {this.href ? (
          <a href={this.href} target={this.target} class={`${this.classPrefix}-menu__item-link`}>
            <span class={`${this.classPrefix}-menu__content`}>{renderContent(this, 'default', 'content')}</span>
          </a>
        ) : (
          <span class={[`${this.classPrefix}-menu__content`]}>{renderContent(this, 'default', 'content')}</span>
        )}
      </li>
    );
  },
});
