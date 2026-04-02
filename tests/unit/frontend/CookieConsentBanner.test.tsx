export function CookieConsentBanner() {
  return {
    type: 'div',
    props: {
      className: 'cookie-banner',
      children: [
        {
          type: 'h2',
          props: { children: 'Cookie Consent' }
        },
        {
          type: 'p',
          props: { children: 'We use cookies to enhance your experience.' }
        },
        {
          type: 'div',
          props: {
            className: 'cookie-buttons',
            children: [
              { type: 'button', props: { 'data-action': 'accept-all', children: 'Accept All' } },
              { type: 'button', props: { 'data-action': 'reject-all', children: 'Reject All' } },
              { type: 'button', props: { 'data-action': 'customize', children: 'Customize' } }
            ]
          }
        }
      ]
    }
  };
}

describe('CookieConsentBanner', () => {
  describe('Component Structure', () => {
    it('should have correct structure', () => {
      const component = CookieConsentBanner();
      
      expect(component.type).toBe('div');
      expect(component.props.className).toBe('cookie-banner');
      expect(component.props.children).toBeInstanceOf(Array);
    });

    it('should have heading', () => {
      const component = CookieConsentBanner();
      const heading = component.props.children[0];
      
      expect(heading.type).toBe('h2');
      expect(heading.props.children).toBe('Cookie Consent');
    });

    it('should have description text', () => {
      const component = CookieConsentBanner();
      const description = component.props.children[1];
      
      expect(description.type).toBe('p');
      expect(description.props.children).toContain('cookies');
    });

    it('should have action buttons', () => {
      const component = CookieConsentBanner();
      const buttonsContainer = component.props.children[2];
      
      expect(buttonsContainer.props.className).toBe('cookie-buttons');
      expect(buttonsContainer.props.children).toHaveLength(3);
    });

    it('should have accept all button', () => {
      const component = CookieConsentBanner();
      const buttons = component.props.children[2].props.children;
      
      const acceptButton = buttons[0];
      expect(acceptButton.type).toBe('button');
      expect(acceptButton.props['data-action']).toBe('accept-all');
      expect(acceptButton.props.children).toBe('Accept All');
    });

    it('should have reject all button', () => {
      const component = CookieConsentBanner();
      const buttons = component.props.children[2].props.children;
      
      const rejectButton = buttons[1];
      expect(rejectButton.type).toBe('button');
      expect(rejectButton.props['data-action']).toBe('reject-all');
      expect(rejectButton.props.children).toBe('Reject All');
    });

    it('should have customize button', () => {
      const component = CookieConsentBanner();
      const buttons = component.props.children[2].props.children;
      
      const customizeButton = buttons[2];
      expect(customizeButton.type).toBe('button');
      expect(customizeButton.props['data-action']).toBe('customize');
      expect(customizeButton.props.children).toBe('Customize');
    });
  });

  describe('Styling', () => {
    it('should have banner class', () => {
      const component = CookieConsentBanner();
      expect(component.props.className).toBe('cookie-banner');
    });

    it('should have buttons container class', () => {
      const component = CookieConsentBanner();
      const buttonsContainer = component.props.children[2];
      expect(buttonsContainer.props.className).toBe('cookie-buttons');
    });
  });
});
