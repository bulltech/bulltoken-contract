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
      development: totalBalance.mul(developmentPercentageCut).floor().div(100).floor(),
      marketing: totalBalance.mul(marketingPercentageCut).floor().div(100).floor(),
      administration: totalBalance.mul(administrationPercentageCut).floor().div(100).floor(),
      earlyBackers: totalBalance.mul(earlyBackersPercentageCut).floor().div(100).floor(),
    };

    const remaining = totalBalance.sub(distributions.development)
                             .sub(distributions.marketing)
                             .sub(distributions.administration)
                             .sub(distributions.earlyBackers);


    // Give the remaining wei from math imprecision to marketing
    distributions.marketing = distributions.marketing.add(remaining);

    return distributions;
  }
}
