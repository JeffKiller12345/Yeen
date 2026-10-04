export default function GoodLuckBanner() {
  return (
    <>
      <div className="goodluck-banner">
        <img
          className="banner-gif"
          src="https://media.tenor.com/nrJ0FfU9WQ0AAAAj/funny.gif"
          alt=""
          aria-hidden="true"
        />
        <div className="banner-text">
          <span className="banner-heading">✿ Good Luck Everyone ✿</span>
          <span className="banner-heading">You got this!!</span>
        </div>
        <img
          className="banner-gif"
          src="https://i.pinimg.com/originals/35/1c/8a/351c8a0fbabdc2196e3e1542e5335c2f.gif"
          alt=""
          aria-hidden="true"
        />
      </div>
      <style jsx>{`
        .goodluck-banner {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: #fff0f6;
          border: 2.5px solid var(--pink-mid);
          box-shadow: 4px 4px 0 var(--pink-mid);
          outline: 2px dashed var(--green-mid);
          outline-offset: -5px;
          padding: 12px 16px;
          text-align: center;
        }

        .banner-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .banner-heading {
          font-family: var(--font-pixel);
          font-size: 9px;
          color: var(--pink-dark);
          letter-spacing: 0.1em;
        }

        .banner-gif {
          width: 60px;
          height: 60px;
          object-fit: contain;
          mix-blend-mode: multiply;
        }
      `}</style>
    </>
  )
}
