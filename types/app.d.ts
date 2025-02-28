/** The global namespace for the app */
declare namespace App {
  /** Theme namespace */
  namespace Theme {
    type ColorPaletteNumber = import('@sa/color').ColorPaletteNumber;

    /** Theme token */
    type ThemeToken = {
      colors: ThemeTokenColor;
      boxShadow: {
        header: string;
        sider: string;
        tab: string;
      };
    };

    /** Theme setting */
    interface ThemeSetting {
      /** Theme scheme */
      themeScheme: UnionKey.ThemeScheme;
      /** grayscale mode */
      grayscale: boolean;
      /** Whether to recommend color */
      recommendColor: boolean;
      /** Theme color */
      themeColor: string;
      /** Theme component visible */
      themeVisible: boolean;
      /** Other color */
      otherColor: OtherColor;
      /** Whether info color is followed by the primary color */
      isInfoFollowPrimary: boolean;
      /** Layout */
      layout: {
        /** Layout mode */
        mode: UnionKey.ThemeLayoutMode;
        /** Scroll mode */
        scrollMode: UnionKey.ThemeScrollMode;
      };
      /** Page */
      page: {
        /** Whether to show the page transition */
        animate: boolean;
        /** Page animate mode */
        animateMode: UnionKey.ThemePageAnimateMode;
      };
      /** Header */
      header: {
        /** Header height */
        height: number;
        /** Header breadcrumb */
        breadcrumb: {
          /** Whether to show the breadcrumb */
          visible: boolean;
          /** Whether to show the breadcrumb icon */
          showIcon: boolean;
        };
      };
      /** Tab */
      tab: {
        /** Whether to show the tab */
        visible: boolean;
        /**
         * Whether to cache the tab
         *
         * If cache, the tabs will get from the local storage when the page is refreshed
         */
        cache: boolean;
        /** Tab height */
        height: number;
        /** Tab mode */
        mode: UnionKey.ThemeTabMode;
      };
      /** Fixed header and tab */
      fixedHeaderAndTab: boolean;
      /** Sider */
      sider: {
        /** Inverted sider */
        inverted: boolean;
        /** Sider width */
        width: number;
        /** Collapsed sider width */
        collapsedWidth: number;
        /** Sider width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixWidth: number;
        /** Collapsed sider width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixCollapsedWidth: number;
        /** Child menu width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixChildMenuWidth: number;
        /** Sider collapse icon and action control */
        control: {
          visible: boolean;
          default: 'collapse' | 'expand';
        };
      };
      /** Footer */
      footer: {
        /** Whether to show the footer */
        visible: boolean;
        /** Whether fixed the footer */
        fixed: boolean;
        /** Footer height */
        height: number;
        /** Whether float the footer to the right when the layout is 'horizontal-mix' */
        right: boolean;
      };
    }

    interface OtherColor {
      info: string;
      success: string;
      warning: string;
      error: string;
    }

    interface ThemeColor extends OtherColor {
      primary: string;
    }

    type ThemeColorKey = keyof ThemeColor;

    type ThemePaletteColor = {
      [key in ThemeColorKey | `${ThemeColorKey}-${ColorPaletteNumber}`]: string;
    };

    type BaseToken = Record<string, Record<string, string>>;

    interface ThemeTokenColor extends ThemePaletteColor {
      nprogress: string;
      container: string;
      layout: string;
      inverted: string;
      base_text: string;
      [key: string]: string;
    }
  }

  /** Global namespace */
  namespace Global {
    type VNode = import('vue').VNode;
    type RouteLocationNormalizedLoaded = import('vue-router').RouteLocationNormalizedLoaded;
    type RouteKey = import('@elegant-router/types').RouteKey;
    type RouteMap = import('@elegant-router/types').RouteMap;
    type RoutePath = import('@elegant-router/types').RoutePath;
    type LastLevelRouteKey = import('@elegant-router/types').LastLevelRouteKey;

    /** The global header props */
    interface HeaderProps {
      /** Whether to show the logo */
      showLogo?: boolean;
      /** Whether to show the menu toggler */
      showMenuToggler?: boolean;
      /** Whether to show the menu */
      showMenu?: boolean;
    }

    /** The global menu */
    interface Menu {
      /**
       * The menu key
       *
       * Equal to the route key
       */
      key: string;
      /** The menu label */
      label: string;
      /** The menu i18n key */
      i18nKey?: I18n.I18nKey | null;
      /** The route key */
      routeKey: RouteKey;
      /** The route path */
      routePath: RoutePath;
      /** The menu icon */
      icon?: () => VNode;
      /** The menu children */
      children?: Menu[];
    }

    type Breadcrumb = Omit<Menu, 'children'> & {
      options?: Breadcrumb[];
    };

    /** Tab route */
    type TabRoute = Pick<RouteLocationNormalizedLoaded, 'name' | 'path' | 'meta'> &
      Partial<Pick<RouteLocationNormalizedLoaded, 'fullPath' | 'query' | 'matched'>>;

    /** The global tab */
    type Tab = {
      /** The tab id */
      id: string;
      /** The tab label */
      label: string;
      /**
       * The new tab label
       *
       * If set, the tab label will be replaced by this value
       */
      newLabel?: string;
      /**
       * The old tab label
       *
       * when reset the tab label, the tab label will be replaced by this value
       */
      oldLabel?: string;
      /** The tab route key */
      routeKey: LastLevelRouteKey;
      /** The tab route path */
      routePath: RouteMap[LastLevelRouteKey];
      /** The tab route full path */
      fullPath: string;
      /** The tab fixed index */
      fixedIndex?: number | null;
      /**
       * Tab icon
       *
       * Iconify icon
       */
      icon?: string;
      /**
       * Tab local icon
       *
       * Local icon
       */
      localIcon?: string;
      /** I18n key */
      i18nKey?: I18n.I18nKey | null;
    };

    /** Form rule */
    type FormRule = import('naive-ui').FormItemRule;

    /** The global dropdown key */
    type DropdownKey = 'closeCurrent' | 'closeOther' | 'closeLeft' | 'closeRight' | 'closeAll';
  }

  /**
   * I18n namespace
   *
   * Locales type
   */
  namespace I18n {
    type RouteKey = import('@elegant-router/types').RouteKey;

    type LangType = 'en-US' | 'zh-CN';

    type LangOption = {
      label: string;
      key: LangType;
    };

    type I18nRouteKey = Exclude<
      RouteKey,
      'root' | 'not-found' | 'exception' | 'exception_403' | 'exception_404' | 'exception_500'
    >;

    type FormMsg = {
      required: string;
      invalid: string;
    };

    type Schema = {
      system: {
        title: string;
      };
      common: {
        action: string;
        add: string;
        addSuccess: string;
        backToHome: string;
        batchDelete: string;
        cancel: string;
        close: string;
        check: string;
        expandColumn: string;
        columnSetting: string;
        config: string;
        confirm: string;
        delete: string;
        deleteSuccess: string;
        confirmDelete: string;
        edit: string;
        index: string;
        keywordSearch: string;
        logout: string;
        logoutConfirm: string;
        lookForward: string;
        modify: string;
        modifySuccess: string;
        noData: string;
        operate: string;
        pleaseCheckValue: string;
        refresh: string;
        reset: string;
        search: string;
        switch: string;
        tip: string;
        trigger: string;
        update: string;
        updateSuccess: string;
        userCenter: string;
        featureTurnOff: string;
        yesOrNo: {
          yes: string;
          no: string;
        };
        warning: string;
      };
      request: {
        logout: string;
        logoutMsg: string;
        logoutWithModal: string;
        logoutWithModalMsg: string;
        refreshToken: string;
        tokenExpired: string;
      };
      theme: {
        themeSchema: { title: string } & Record<UnionKey.ThemeScheme, string>;
        grayscale: string;
        layoutMode: { title: string } & Record<UnionKey.ThemeLayoutMode, string>;
        recommendColor: string;
        recommendColorDesc: string;
        themeColor: {
          title: string;
          followPrimary: string;
        } & Theme.ThemeColor;
        scrollMode: { title: string } & Record<UnionKey.ThemeScrollMode, string>;
        page: {
          animate: string;
          mode: { title: string } & Record<UnionKey.ThemePageAnimateMode, string>;
        };
        fixedHeaderAndTab: string;
        header: {
          height: string;
          breadcrumb: {
            visible: string;
            showIcon: string;
          };
        };
        tab: {
          visible: string;
          cache: string;
          height: string;
          mode: { title: string } & Record<UnionKey.ThemeTabMode, string>;
        };
        sider: {
          inverted: string;
          width: string;
          collapsedWidth: string;
          mixWidth: string;
          mixCollapsedWidth: string;
          mixChildMenuWidth: string;
        };
        footer: {
          visible: string;
          fixed: string;
          height: string;
          right: string;
        };
        themeDrawerTitle: string;
        pageFunTitle: string;
        configOperation: {
          copyConfig: string;
          copySuccessMsg: string;
          resetConfig: string;
          resetSuccessMsg: string;
        };
      };
      route: Record<I18nRouteKey, string>;
      page: {
        login: {
          common: {
            loginOrRegister: string;
            userNamePlaceholder: string;
            phonePlaceholder: string;
            codePlaceholder: string;
            passwordPlaceholder: string;
            confirmPasswordPlaceholder: string;
            codeLogin: string;
            confirm: string;
            back: string;
            validateSuccess: string;
            loginSuccess: string;
            welcomeBack: string;
          };
          pwdLogin: {
            title: string;
            rememberMe: string;
            forgetPassword: string;
            register: string;
            otherAccountLogin: string;
            otherLoginMode: string;
            superAdmin: string;
            admin: string;
            user: string;
          };
          codeLogin: {
            title: string;
            getCode: string;
            reGetCode: string;
            sendCodeSuccess: string;
            imageCodePlaceholder: string;
          };
          register: {
            title: string;
            agreement: string;
            protocol: string;
            policy: string;
          };
          resetPwd: {
            title: string;
          };
          bindWeChat: {
            title: string;
          };
        };
        home: '';
      };
      form: {
        required: string;
        userName: FormMsg;
        phone: FormMsg;
        pwd: FormMsg;
        confirmPwd: FormMsg;
        code: FormMsg;
        email: FormMsg;
      };
      dropdown: Record<Global.DropdownKey, string>;
      icon: {
        themeConfig: string;
        themeSchema: string;
        lang: string;
        fullscreen: string;
        fullscreenExit: string;
        reload: string;
        collapse: string;
        expand: string;
        pin: string;
        unpin: string;
      };
      datatable: {
        itemCount: string;
      };
    } & BusinessLanguage.Schema;
    type GetI18nKey<T extends Record<string, unknown>, K extends keyof T = keyof T> = K extends string
      ? T[K] extends Record<string, unknown>
      ? `${K}.${GetI18nKey<T[K]>}`
      : K
      : never;

    type I18nKey = GetI18nKey<Schema>;

    type TranslateOptions<Locales extends string> = import('vue-i18n').TranslateOptions<Locales>;

    interface $T {
      (key: I18nKey): string;
      (key: I18nKey, plural: number, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, defaultMsg: string, options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], plural: number): string;
      (key: I18nKey, list: unknown[], defaultMsg: string): string;
      (key: I18nKey, named: Record<string, unknown>, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, named: Record<string, unknown>, plural: number): string;
      (key: I18nKey, named: Record<string, unknown>, defaultMsg: string): string;
    }
  }
  namespace BusinessLanguage {
    export type Schema = {
      // remove current content
      businessCommon: {
        confirm1: string;
        cancel: string;
        restoreFactoryHint: string;
        rename: string;
        edit: string;
        delete: string;
        save: string;
        delSuccess: string;
        executeSuccess: string;
        executeFail: string;
        delFailPlsUpdate: string;
        plsUpdate: string;
        addSuccess: string;
        set: string;
        addFailPlsUpdate: string;
        addSwtich: string;
        plsSetSwitchKeys: string;
        switchSwitch: string;
        connectHint: string;
        buttonDisableInfo: string;
        temporaryUnavailable: string;
        connectTimeout: string;
        connectDev: string;
        btnSelectRequired: string;
        confirmToReset: string;
      };
      baseKey: {
        keyboard: {
          exeDot: string;
          exeRt: string;
          resetRt: string;
          bandKey: string;
          cancelBandKey: string;
          recvoer: string;
          admin1: string;
          x7: string;
          current: string;
          keyboardHint: string;
          removeSpkeyChange: string;
        };
        tab: {
          basic: string;
          system: string;
          media: string;
          combination: string;
          special: string;
          macro: string;
        };
        combination: {
          plsSelctKeyComb: string;
          addCombKey: string;
        };
        system: {
          screenBrightnessMinus: string;
          screenBrightnessPlus: string;
          save: string;
          selectAll: string;
          closeWindow: string;
          openWindow: string;
          delete: string;
          cut: string;
          copy: string;
          paste: string;
          record: string;
          calculator: string;
          restore: string;
          myComputer: string;
          screenshot: string;
          openXbox: string;
          taskManager: string;
          openFolder: string;
          openDesktop: string;
          undo: string;
          newFolder: string;
          minimize: string;
          find: string;
        };
        media: {
          previousTrack: string;
          nextTrack: string;
          playPause: string;
          stopPlayback: string;
          volumePlus: string;
          volumeMinus: string;
          mute: string;
          launchMedia: string;
          homePage: string;
          search: string;
          refresh: string;
          favorites: string;
          goForward: string;
          goBack: string;
          stopWebpage: string;
          mail: string;
          openBrowser: string;
        };
        special: {
          FN1: string;
          FN2: string;
          FN3: string;
          config1: string;
          config2: string;
          config3: string;
          config4: string;
          config5: string;
          bluetooth1: string;
          bluetooth2: string;
          bluetooth3: string;
          bluetooth4: string;
          bluetooth5: string;
          twoPoint4G: string;
          USB: string;
          switchLightingEffect: string;
          toggleWakeOnContact: string;
          backlightBrightnessMinus: string;
          backlightBrightnessPlus: string;
          lockWIN: string;
          switchWinLayer: string;
          switchMacLayer: string;
          resetToFactory: string;
          lightingSpeedMinus: string;
          lightingSpeedPlus: string;
          switchLightingColor: string;
        };
      };
      repidTrigger: {
        showArg: string;
        pollingRate: string;
        triggerDeadZone: string;
        liftDeadZone: string;
        reset: string;
        switchType: string;
        fastTrigger: string;
        fastTriggerDesc: string;
        pressSensitivity: string;
        pressSensitivityDesc: string;
        liftSensitivity: string;
        advancedSettings: string;
        debounceOptimization: string;
        debounceLevel: string;
        low: string;
        medium: string;
        high: string;
        keyLevelIllustration: string;
        illustrationNote: string;

        dgzsxsszjz: string;
        doubleAdjust: string;
        doubleAdjustHint: string;
        handAdjust: string;
        handAdjustHint: string;
        startAdjust: string;

        property: string;
        adjust: string;
        rtTopDeadZone: string;
        rtBellowDeadZone: string;
        exeDistance: string;
      };
      supperKey: {
        x1: string;
        x2: string;
        x3: string;
        x5: string;
        x6: string;
        x7: string;
        x8: string;
        plsSelectKey: string;
        c1: string;
        c2: string;
        c3: string;
        c4: string;
        c5: string;
        c6: string;
        c7: string;
        c8: string;
        singleKeyStop: string;
        addClickDown: string;
        setClickDowndown1down2: string;
        priorityExe: string;

        keyBinedDKSFunc: string;
        keyBinedOtherFunc: string;
        maxAddCombinKey: string;
      };
      macro: {
        addMacroKey: string;
        enable: string;
        updateAllTime: string;
        showTime: string;
        randomDelay: string;
        exeCompleStop: string;
        againDownStop: string;
        stop: string;
        loop: string;
        downDelayExe: string;
        exe: string;
        keyInfo: string;
        downExe: string;
        updExe: string;
        q15: string;
        time: string;
        q17: string;
        startRecord: string;
        q19: string;
        q20: string;
      };
      light: {
        modeSelect: string;
        q0: string;
        q1: string;
        q2: string;
        q3: string;
        q4: string;
        q5: string;
        q6: string;
        q7: string;
        luminance: string;
        speend: string;
        lightSleep: string;
        interaction: string;
        never: string;
        color: string;
        minute: string;
        allColor: string;
      };
      setting: {
        devName: string;
        connectMode: string;
        allKeyNot: string;
        wakeUp: string;
        wakeUpHint: string;
        gjUpdate: string;
        checkUpdate: string;
        restore: string;
        pair24: string;
        wakeUpOpenHint: string;
        wakeUpClosenHint: string;
        allKeyOpenHint: string;
        allKeyCloseHint: string;
        restoreSucess: string;
      };
      global_Setting: {
        version: string;
        qdVersion: string;
        versionInfo: string;
        contactUs: string;
        moreProduct: string;
        officialWeb: string;
        wechart: string;
      };
    };
  }
  /** Service namespace */
  namespace Service {
    /** Other baseURL key */
    type OtherBaseURLKey = 'demo';

    interface ServiceConfigItem {
      /** The backend service base url */
      baseURL: string;
      /** The proxy pattern of the backend service base url */
      proxyPattern: string;
    }

    interface OtherServiceConfigItem extends ServiceConfigItem {
      key: OtherBaseURLKey;
    }

    /** The backend service config */
    interface ServiceConfig extends ServiceConfigItem {
      /** Other backend service config */
      other: OtherServiceConfigItem[];
    }

    interface SimpleServiceConfig extends Pick<ServiceConfigItem, 'baseURL'> {
      other: Record<OtherBaseURLKey, string>;
    }

    /** The backend service response data */
    type Response<T = unknown> = {
      /** The backend service response code */
      code: string;
      /** The backend service response message */
      msg: string;
      /** The backend service response data */
      data: T;
    };

    /** The demo backend service response data */
    type DemoResponse<T = unknown> = {
      /** The backend service response code */
      status: string;
      /** The backend service response message */
      message: string;
      /** The backend service response data */
      result: T;
    };
  }
}
