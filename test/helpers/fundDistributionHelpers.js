export default class FundDistributionHelper {
  constructor(
    developmentWallet,
    administrationWallet,
    marketingWallet,
    earlyBackersWallet
  ) {
    this.developmentWallet = developmentWallet;
    this.administrationWallet = administrationWallet;
    this.marketingWallet = marketingWallet;
    this.earlyBackersWallet = earlyBackersWallet;
  }

  getBalances() {
    return {
      development: web3.eth.getBalance(this.developmentWallet),
      administration: web3.eth.getBalance(this.administrationWallet),
      marketing: web3.eth.getBalance(this.marketingWallet),
      earlyBackers: web3.eth.getBalance(this.earlyBackersWallet)
    }
  }

  expectedFundDistribution(totalBalance) {
    const developmentPercentageCut = 56;
    const marketingPercentageCut = 12;
    const administrationPercentageCut = 15;
    const earlyBackersPercentageCut = 17;

    let distributions = {
      development: totalBalance.div(100).floor().mul(developmentPercentageCut).floor(),
      marketing: totalBalance.div(100).floor().mul(marketingPercentageCut).floor(),
      administration: totalBalance.div(100).floor().mul(administrationPercentageCut).floor(),
      earlyBackers: totalBalance.div(100).floor().mul(earlyBackersPercentageCut).floor(),
    }

    const remaining = totalBalance.sub(distributions.development)
                             .sub(distributions.marketing)
                             .sub(distributions.administration)
                             .sub(distributions.earlyBackers)


    // Give the remaining wei from math imprecision to marketing
    distributions.marketing = distributions.marketing.add(remaining);

    return distributions;
  }
}
