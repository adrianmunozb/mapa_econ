import { memo, useEffect, useState } from 'react';
import { MAJOR_MARKETS, getMarketStatus, type StockMarket } from '../data/markets';

interface Props {
  onFlyToCoord?: (coord: [number, number]) => void;
}

export const MarketBar = memo(function MarketBar({ onFlyToCoord }: Props) {
  const [now, setNow] = useState(new Date());

  // Actualizar cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="market-ticker-container hud">
      <div className="market-ticker-label">
        <span className="ticker-pulse"></span>
        <span className="ticker-title">MERCADOS GLOBALES</span>
      </div>
      <div className="market-ticker-items">
        {MAJOR_MARKETS.slice(0, 7).map((m: StockMarket) => {
          const status = getMarketStatus(m, now);
          return (
            <button
              key={m.id}
              className={`market-item ${status.isOpen ? 'market-item--open' : 'market-item--closed'}`}
              onClick={() => onFlyToCoord?.(m.coordinates)}
              title={`${m.name} (${m.indexName}) - ${m.city}. Click para centrar en el mapa.`}
            >
              <span className="market-item__flag">{m.flag}</span>
              <span className="market-item__name">{m.shortName}</span>
              <span className={`market-item__indicator ${status.isOpen ? 'indicator--live' : ''}`} />
              <span className="market-item__time">{status.localTimeStr}</span>
              <span className="market-item__badge">{status.isOpen ? 'ABIERTO' : status.statusText}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
